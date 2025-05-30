import fetch from 'node-fetch';

export async function postDiscordWebhook(webhookUrl, message) {
  const body = { content: message };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    console.log('Message envoyé sur Discord !');
  } else {
    console.error('Erreur en envoyant le message :', res.status);
  }
}
