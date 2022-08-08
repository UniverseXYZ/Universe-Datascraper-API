export default () => ({
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  port: process.env.PORT,
  app_env: process.env.APP_ENV,
  session_secret: process.env.SESSION_SECRET,
  disableAggregation: process.env.DISABLE_AGGREGATION || false,
  refreshDelayDays: process.env.REFRESH_DELAY_DAYS || 1,
});
