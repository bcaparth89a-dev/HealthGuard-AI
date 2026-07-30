import React from 'react';
import TimelineItem from './TimelineItem';

export const Timeline = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-xs text-slate-400">No experience items registered.</p>;
  }

  return (
    <div className="relative group">
      {items.map((item, idx) => (
        <TimelineItem
          key={idx}
          index={idx}
          role={item.role}
          company={item.company}
        />
      ))}
    </div>
  );
};

export default Timeline;
