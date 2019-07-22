import { config } from 'dotenv';
import sgMail from '@sendgrid/mail';

config();
const secret = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(secret);

const templates = {
  password_reset: 'd-3fa45363fe634b418146f72cbe03942b',
  confirm_account: 'd-84376bbc49e24647ab77848bcb926eb5'
};

const mailer = data => {
  const { name, receiver, subject, templateName } = data;
  const msg = {
    to: receiver,
    from: 'noreply@kifaru-ah.com',
    subject,
    templateId: templates[templateName],
    dynamic_template_data: {
      name,
      confirm_account_url: data.confirm_account_url,
      reset_password_url: data.reset_password_url
    }
  };

  sgMail.send(msg);
};

export default mailer;
