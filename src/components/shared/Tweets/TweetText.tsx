import React from 'react';
import { Status } from 'twitter-d';
import { PartialTweet } from 'twitter-archive-reader';
import classes from './TweetText.module.scss';

const TWITTER_BASE = "https://twitter.com/";
const TWITTER_HASH_BASE = "https://twitter.com/search?q=";

type TweetTextProp = {
  data: PartialTweet | Status,
};

export default class TweetText extends React.Component<TweetTextProp> {
  calculateFragments() {
    const frags: [number, number, JSX.Element][] = [];

    const t = this.tweet.retweeted_status ? this.tweet.retweeted_status : this.tweet;

    if (t.entities) {
      if (t.entities.user_mentions && t.entities.user_mentions.length) {
        for (const m of t.entities.user_mentions) {
          frags.push([Number(m.indices[0]), Number(m.indices[1]), 
            <a 
              target="_blank" 
              rel="noopener noreferrer" 
              title={'@' + m.screen_name} 
              href={TWITTER_BASE + m.screen_name}
              key={String(frags.length)}
            >@{m.screen_name}</a>
          ]);
        }
      }

      if (t.entities.urls && t.entities.urls.length) {
        for (const u of t.entities.urls) {
          frags.push([Number(u.indices[0]), Number(u.indices[1]), 
            <a 
              target="_blank" 
              rel="noopener noreferrer" 
              title={'Link to ' + u.display_url} 
              href={u.expanded_url}
              key={String(frags.length)}
            >{u.display_url}</a>
          ]);
        }
      }

      if (t.entities.hashtags && t.entities.hashtags.length) {
        for (const h of t.entities.hashtags) {
          frags.push([Number(h.indices[0]), Number(h.indices[1]), 
            <a 
              target="_blank" 
              rel="noopener noreferrer" 
              title={'#' + h.text} 
              href={TWITTER_HASH_BASE + encodeURIComponent('#' + h.text)}
              key={String(frags.length)}
            >#{h.text}</a>
          ]);
        }
      }

      if (t.entities.media && t.entities.media.length) {
        // First link is always the good one
        const m = t.entities.media[0];
        frags.push([Number(m.indices[0]), Number(m.indices[1]), 
          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            title={'Link to picture ' + m.display_url} 
            href={m.expanded_url}
            key={String(frags.length)}
          >{m.display_url}</a>
        ]);
      }
    }

    // Tri par ordre d'apparition croissant
    return frags.sort((a, b) => a[0] - b[0]);
  }

  renderText(frags: [number, number, JSX.Element][]) {
    const parts: JSX.Element[] = [];
    const original_t = this.tweet.retweeted_status ? this.tweet.retweeted_status : this.tweet;

    // @ts-ignore
    const original_string: string = original_t.full_text ? original_t.full_text : original_t.text;

    let last_end = 0;
    let i = 1;

    // Assemble les fragments et les lie avec les parties 
    // de la chaîne originale entre eux
    for (const [begin, end, element] of frags) {
      if (begin !== last_end) {
        parts.push(<span key={String(frags.length + i)}>{original_string.slice(last_end, begin)}</span>);
      }
      parts.push(element);
      last_end = end;
      i++;
    }

    // Rend le reste de la chaîne originale si besoin
    if (original_string.length !== last_end) {
      parts.push(<span key={String(frags.length + i)}>{original_string.slice(last_end)}</span>);
    }

    return parts;
  }

  get tweet() {
    return this.props.data;
  }

  render() {
    return this.renderText(this.calculateFragments());
  }
}