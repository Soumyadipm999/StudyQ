import { corsHeaders } from '../_shared/cors.ts';

interface WhatsAppRequest {
  to: string;
  message: string;
  materialTitle?: string;
  materialUrl?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, materialTitle, materialUrl }: WhatsAppRequest = await req.json();

    // Validate required fields
    if (!to || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, message' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';

    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Twilio credentials not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format phone number for WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // Prepare WhatsApp message data
    const messageData = {
      From: twilioWhatsAppNumber,
      To: formattedTo,
      Body: message
    };

    // Add media URL if material is provided
    if (materialUrl) {
      messageData.MediaUrl = materialUrl;
    }

    // Create basic auth header for Twilio
    const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    // Send WhatsApp message via Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(messageData).toString()
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ WhatsApp message sent successfully to ${to}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `WhatsApp message sent successfully to ${to}`,
          deliveryId: result.sid || `WA_${Date.now()}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorText = await response.text();
      console.error('Twilio API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Twilio API error: ${response.status}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('WhatsApp sending error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});