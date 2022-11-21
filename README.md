## Description

To run the project with npm run start enter your MONGODB URI, Stripe key and SendGrid API key inside package.json

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "SET NODE_ENV=development&&SET MONGODB_URI='YOUR_URI'&&SET STRIPE_KEY='YOUR_STRIPE_KEY'&&SET SENDGRID_API_KEY='YOUR_SENDGRID_API_KEY'&&node app.js",
    "dev": "nodemon app"
  },
```

To run the project with npm run dev create a nodemon.json file and enter your MONGODB URI, Stripe key and SendGrid API key inside package.json

```json
{
  "env": {
    "MONGODB_URI": "MONGODB_URI",
    "STRIPE_KEY": "STRIPE_KEY",
    "NODE_ENV": "development",
    "SENDGRID_API_KEY": "SENDGRID_API_KEY"
  }
}
```
