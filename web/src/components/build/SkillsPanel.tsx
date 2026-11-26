import { Fragment } from "react";
import type { SkillOrder } from "../../api/types";
import { skillLevels } from "../../utils/build";
import { Panel } from "../ui/Panel";
import { OptionStats } from "./OptionStats";

type SkillsPanelProps = {
  skills: SkillOrder | null;
};

export function SkillsPanel({ skills }: SkillsPanelProps) {
  if (!skills) return null;

  return (
    <Panel title="Habilidades" aside={<OptionStats games={skills.games} winrate={skills.winrate} />}>
      <div className="p-panel">
        <p className="caption mb-2">Orden para subir al máximo</p>
        <p className="flex items-center gap-2" aria-label={`Prioridad: ${[...skills.priority].join(", ")}`}>
          {[...skills.priority].map((skill, index) => (
            <Fragment key={skill}>
              {index > 0 && (
                <span aria-hidden="true" className="text-faint">
                  ›
                </span>
              )}
              <span
                aria-hidden="true"
                className={`grid size-9 place-items-center rounded-ui font-display text-xl font-bold ${index === 0 ? "bg-brand text-bg" : "bg-panel-2"}`}
              >
                {skill}
              </span>
            </Fragment>
          ))}
        </p>

        {skills.sequence && <SkillSequence sequence={skills.sequence} />}
      </div>
    </Panel>
  );
}

function SkillSequence({ sequence }: { sequence: string }) {
  const levels = [...sequence].map((_, index) => index + 1);

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-center text-meta tabular-nums">
        <caption className="sr-only">Habilidad que se sube en cada nivel</caption>
        <tbody>
          {skillLevels(sequence).map(({ skill, levels: skillUps }) => (
            <tr key={skill}>
              <th scope="row" className="w-6 pr-1 text-left font-display text-base font-bold">
                {skill}
              </th>
              {levels.map((level) => {
                const isUp = skillUps.includes(level);
                return (
                  <td
                    key={level}
                    className={`size-6 rounded-[3px] ${isUp ? (skill === "R" ? "bg-gold font-bold text-bg" : "bg-brand font-bold text-bg") : "bg-panel-2"}`}
                  >
                    {isUp ? level : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
