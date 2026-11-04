import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../context/account-context';
import { discovery } from '../utils/discovery';
import { editionLanes, selectEdition } from '../utils/edition';
import { durationSeconds } from '../utils/video-metadata';
import { readLibrary, videoId } from '../utils/library';
import SideBar from './side-bar';
import VideoLink from './video-link';
import VideoFacts from './video-facts';
import { Icon, Thumbnail } from './ui';

const topicPath = name => `/topic/${encodeURIComponent(name.toLowerCase())}`;

function Story({ pick, lead = false }) {
  const { video, lane } = pick;
  const href = `/video/${encodeURIComponent(videoId(video))}`;
  return <article className={lead ? 'edition-lead' : 'edition-story'} data-edition-pick={videoId(video)}>
    <VideoLink className="edition-image" to={href} aria-label={`Watch ${video.snippet?.title || 'video'}`}>
      <Thumbnail item={video} loading={lead ? 'eager' : 'lazy'} />
      <span className="edition-play"><Icon name="play" /></span>
    </VideoLink>
    <div className="edition-story-copy">
      <Link className="edition-topic" to={topicPath(lane.topic)}>{lane.name}</Link>
      {lead
        ? <h2><VideoLink to={href}>{video.snippet?.title || 'Untitled video'}</VideoLink></h2>
        : <h3><VideoLink to={href}>{video.snippet?.title || 'Untitled video'}</VideoLink></h3>}
      <p className="edition-creator">{video.snippet?.channelTitle || 'Creator unavailable'}</p>
      <VideoFacts video={video} showUnknown />
      {lead && <>
        <p className="edition-context">{lane.reason}</p>
        <VideoLink className="button primary" to={href}><Icon name="play" />Watch video</VideoLink>
      </>}
    </div>
  </article>;
}

export default function TodayPage() {
  const account = useAccount();
  const owner = account.user?.id || null;
  const [date] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({owner, lanes: [], errors: [], loading: true});

  useEffect(() => {
    let active = true;
    setOffset(0);
    setState(old => ({owner, lanes: old.owner === owner ? old.lanes : [], errors: [], loading: true}));
    if (account.loading) return () => { active = false; };
    const watchedIds = new Set(readLibrary('history').map(videoId));
    Promise.allSettled(editionLanes.map(lane => discovery.discover(lane.query, {watchedIds, random: () => 0})))
      .then(results => {
        if (!active) return;
        const errors = [];
        const lanes = editionLanes.map((lane, index) => {
          const result = results[index];
          if (result.status === 'rejected') errors.push({name: lane.name, message: result.reason?.message || 'Could not load videos. Please try again.'});
          return {...lane, items: result.status === 'fulfilled' ? result.value.items : []};
        });
        setState({owner, lanes, errors, loading: false});
      });
    return () => { active = false; };
  }, [owner, account.loading, attempt]);

  // Do not show the previous account's selection while effects are catching up.
  const ready = state.owner === owner && !account.loading;
  const picks = ready ? selectEdition(state.lanes, offset) : [];
  const loading = !ready || state.loading;
  const seconds = picks.map(pick => durationSeconds(pick.video));
  const total = seconds.length && seconds.every(value => value !== null)
    ? Math.ceil(seconds.reduce((sum, value) => sum + value, 0) / 60) : null;
  const [lead, ...next] = picks;
  const retry = () => setAttempt(value => value + 1);

  return <div className="app-layout personal-layout">
    <SideBar />
    <main id="main" className="feed today-page">
      <div className="edition-heading">
        <div>
          <h1>Today, a little wider.</h1>
          <p>A few good videos. A wider point of view.</p>
        </div>
        <time dateTime={date.toLocaleDateString('en-CA')}>{new Intl.DateTimeFormat('en', {weekday:'short', month:'short', day:'numeric'}).format(date)}</time>
      </div>
      <div className="edition-toolbar">
        <p aria-live="polite">{loading ? 'Finding your next perspectives…' : `${picks.length} ${picks.length === 1 ? 'pick' : 'picks'}${total ? ` · ${total} min` : ''}`}</p>
        <button className="button" onClick={() => setOffset(value => value + 1)} disabled={loading || !picks.length}>
          <Icon name="refresh" />Shuffle picks
        </button>
      </div>
      {loading && !picks.length && <div className="edition-loading" role="status" aria-label="Loading your selection"><div /><div /></div>}
      {ready && state.errors.length > 0 && <div className="edition-notice" role="alert">
        <p>Couldn’t load {state.errors.map(error => error.name).join(', ')}. {state.errors[0].message} {picks.length > 0 && 'The other topics are still here.'}</p>
        <button className="text-button" onClick={retry} disabled={loading}>{picks.length ? 'Retry unavailable topics' : 'Try again'}</button>
      </div>}
      {lead && <section className="edition-layout" aria-label="Your selection">
        <Story pick={lead} lead />
        {next.length > 0 && <div className="edition-next">
          <h2>Then, a different angle.</h2>
          {next.map(pick => <Story key={videoId(pick.video)} pick={pick} />)}
        </div>}
      </section>}
      {!loading && !lead && !state.errors.length && <div className="empty-state">
        <h2>A little further afield?</h2>
        <p>No unwatched videos came back for this selection. Explore a topic or revisit your saved videos.</p>
        <Link className="button primary" to="/explore">Explore topics</Link>
      </div>}
      {lead && <div className="edition-ending">
        <div><h2>Leave with something new.</h2><p>One video can be enough. Save the rest from the watch page.</p></div>
        <Link to="/explore">Follow your curiosity <Icon name="arrow" /></Link>
      </div>}
      <section className="edition-interests" aria-labelledby="interests-title">
        <div><h2 id="interests-title">Your own rabbit holes</h2><Link to="/account">Choose interests</Link></div>
        <nav className="chips" aria-label="Your interests">
          <Link className="chip" to="/explore">For you</Link>
          {(account.favorites.length ? account.favorites : ['AI', 'Landscapes', 'Culture & Food', 'World & Science']).map(name =>
            <Link className="chip" key={name} to={topicPath(name)}>{name}</Link>)}
        </nav>
      </section>
      <p className="edition-footnote">Today’s selection mixes background and recent videos. Dates are publication dates, not event dates. When lengths are missing, choose what fits your 20–30 minute break.</p>
    </main>
  </div>;
}
