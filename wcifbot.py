import praw
import pprint
import requests
import re
import time

from apscheduler.schedulers.background import BlockingScheduler

import config

cache = []
reddit = praw.Reddit(client_id=config.CLIENT_ID,
                     client_secret=config.CLIENT_SECRET,
                     user_agent=config.USER_AGENT,
                     username=config.USERNAME,
                     password=config.PASSWORD)
start_time = int(time.time())


def check_for_new_posts():
    submission = reddit.submission(id=config.THREAD_ID)
    for comment in submission.comments:
        if start_time > comment.created_utc:
            continue

        if comment.id in cache:
            continue

        regex = r"myanimelist\.net\/(anime|manga)\/(\d+)"
        mal_link = re.search(regex, comment.body)

        if not mal_link:
            continue

        api_data = get_streams_data(mal_link.group(1), mal_link.group(2))
        title, streams = parse_streams_data(api_data)
        pprint(streams)
        # comment.reply(f"""I found streams for {title} available on
        # the following services: {", ".join(sorted(streams))}""")
        # cache.append(comment.id)


def get_streams_data(content_type, mal_id):
    api_url = config.API.format(type=content_type, id=mal_id)
    r = requests.get(api_url)
    return r.json()


def parse_streams_data(api_data):
    stream_count = len(api_data["Sites"])
    sites = []
    for site in range(stream_count):
        sites.append(list(api_data["Sites"].keys())[site])
    return ((api_data["title"], sites))


if __name__ == '__main__':
    print(f"Authenticated successfully as: {reddit.user.me()}")
    print(f"Current time is: {start_time}")
    print("Listening for posts...")
    scheduler = BlockingScheduler(daemon=True)
    scheduler.add_job(check_for_new_posts, "interval", seconds=config.CRON_INTERVAL)
    scheduler.start()
