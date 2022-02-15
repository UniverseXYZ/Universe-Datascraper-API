export default () => ({
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  port: process.env.APP_PORT,
  app_env: process.env.APP_ENV,
  session_secret: process.env.SESSION_SECRET,
});
