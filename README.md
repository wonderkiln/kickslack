# Kickslack

Kickslack is designed to monitor a given Kickstarter project, and to deliver all new comments and funding to your Slack #kickstarter channel. **The provided configuration will check for updates every 15 minutes.**

## Set It and Forget it

1. [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

2. Configure the environment variables to your own Kickstarter Project URL, and Slack Webhook URL:

        KICKSTARTER_URL
        SLACK_WEBHOOK_URL

3. New messages and funding updates will be delivered to the #kickstarter channel.