import Link from "next/link";

import { formatMinutes } from "@/lib/format";
import type { ScheduleItem } from "@/lib/types";

type ScheduleListProps = {
  items: ScheduleItem[];
};

/** Episódios da programação, em ordem de horário (como vêm do backend). */
export default function ScheduleList({ items }: ScheduleListProps) {
  return (
    <ol className="schedule-list">
      {items.map((item) => (
        <li key={item.id} className="schedule-item">
          <p className="schedule-item__time">
            {item.airtime ? <time dateTime={item.airtime}>{item.airtime}</time> : "Horário não informado"}
          </p>
          <div>
            <h3 className="schedule-item__show">
              <Link href={`/shows/${item.show.id}`}>{item.show.name}</Link>
            </h3>
            <p className="schedule-item__episode">{describeEpisode(item)}</p>
            <p className="schedule-item__meta">
              {[
                item.show.network,
                item.runtime_minutes !== null ? formatMinutes(item.runtime_minutes) : null,
              ]
                .filter((part) => part !== null)
                .join(" · ")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Ex.: "Temporada 1, episódio 151: Capítulo 151". */
function describeEpisode(item: ScheduleItem): string {
  const parts: string[] = [];
  if (item.season !== null) {
    parts.push(`Temporada ${item.season}`);
  }
  if (item.number !== null) {
    parts.push(`episódio ${item.number}`);
  }
  const position = parts.join(", ");
  return position ? `${position}: ${item.episode_name}` : item.episode_name;
}
