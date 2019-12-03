const rp = require("request-promise");

module.exports = class RedditClient {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  async login() {
    const opts = {
      url: "https://www.reddit.com/loginproxy",
      method: "POST",
      headers: {
        origin: "https://www.reddit.com",
        referer: "https://www.reddit.com/login",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Mobile Safari/537.36"
      },
      json: { username: this.username, password: this.password, otp: "" }
    };

    try {
      const body = await rp(opts);
      this.accessToken = body["session"]["accessToken"];

      console.log("Logged in.");
    } catch (err) {
      throw Error(`Error logging into ${this.username} ${err.message}`);
    }
  }

  async deletePost(id) {
    const opts = {
      url:
        "https://oauth.reddit.com/api/del?redditWebClient=mweb2x&app=2x-client-production&raw_json=1&gilding_detail=1",
      method: "POST",
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "user-agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Mobile Safari/537.36"
      },
      formData: {
        id
      },
      resolveWithFullResponse: true
    };
    try {
      await rp(opts);
    } catch (err) {
      throw Error(err);
    }
  }

  async deleteComments(afterId) {
    const opts = {
      url: `https://oauth.reddit.com/user/${this.username}/comments.json?redditWebClient=mweb2x&layout=classic&user=${this.username}&sort=confidence&activity=comments&feature=link_preview&sr_detail=true&raw_json=1&app=2x-client-production`,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "user-agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Mobile Safari/537.36"
      },
      json: true
    };

    if (afterId) opts["url"] = `${opts["url"]}&after=${afterId}`;

    try {
      const resp = await rp(opts);
      for (let comment of resp["data"]["children"]) {
        console.log(
          "Deleting",
          comment["data"]["subreddit_name_prefixed"],
          comment["data"]["body"],
          comment["data"]["name"]
        );
        await this.deletePost(comment["data"]["name"]);
      }

      const scrapedId = resp["data"]["after"];
      if (scrapedId) await this.deleteComments(scrapedId);
    } catch (err) {
      throw Error(err);
    }
  }

  async deleteSubmitted(afterId) {
    const opts = {
      url: `https://oauth.reddit.com/user/${this.username}/submitted.json?redditWebClient=mweb2x&layout=classic&user=${this.username}&sort=confidence&activity=submitted&feature=link_preview&sr_detail=true&raw_json=1&app=2x-client-production`,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "user-agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Mobile Safari/537.36"
      },
      json: true
    };

    if (afterId) opts["url"] = `${opts["url"]}&after=${afterId}`;

    try {
      const resp = await rp(opts);
      for (let submitted of resp["data"]["children"]) {
        console.log(
          "Deleting",
          submitted["data"]["subreddit_name_prefixed"],
          submitted["data"]["title"],
          submitted["data"]["name"]
        );
        await this.deletePost(submitted["data"]["name"]);
      }

      const scrapedId = resp["data"]["after"];
      if (scrapedId) await this.deleteSubmitted(scrapedId);
    } catch (err) {
      throw Error(err);
    }
  }
};
