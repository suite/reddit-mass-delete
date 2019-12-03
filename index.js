const RedditClient = require("./reddit.js");
const config = require("./config.js");
(async () => {
  const reddit = new RedditClient(config.username, config.password);

  try {
    await reddit.login();
    await reddit.deleteComments();
    await reddit.deleteSubmitted();
    console.log("Finished.");
  } catch (err) {
    console.log(err);
  }
})();
