import React, { useEffect, useState } from 'react';
import { installPullToRefresh } from '../utils/pull-to-refresh';
import { Icon } from './ui';

export default function PullToRefresh() {
  const [pull, setPull] = useState({distance:0,ready:false,loading:false});
  useEffect(() => installPullToRefresh({onChange:setPull}), []);
  if (!pull.distance) return null;
  return <div className={`pull-refresh${pull.ready ? ' ready' : ''}${pull.loading ? ' loading' : ''}`}
    role="status" style={{'--pull-travel':`${Math.min(pull.distance * .25,40)}px`}}>
    <Icon name="refresh" />
    <span>{pull.loading ? 'Reloading…' : pull.ready ? 'Release to reload' : 'Pull to reload'}</span>
  </div>;
}
