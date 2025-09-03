import { corsHeaders } from '../_shared/cors.ts';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  materialTitle?: string;
  materialUrl?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, materialTitle, materialUrl }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get SendGrid API key from environment
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@studyq.edu';

    if (!sendGridApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SendGrid API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare email data for SendGrid
    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject
        }
      ],
      from: { email: fromEmail, name: 'StudyQ Platform' },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    };

    // Add attachment if material URL is provided
    if (materialUrl && materialTitle) {
      emailData.attachments = [
        {
          content: materialUrl,
          filename: materialTitle,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ];
    }

    // Send email via SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log(`✅ Email sent successfully to ${to}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent successfully to ${to}`,
          deliveryId: `EMAIL_${Date.now()}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorText = await response.text();
      console.error('SendGrid API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `SendGrid API error: ${response.status}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Email sending error:', error);
    
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