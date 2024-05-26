import type { Changelog } from "./changelogs";

function Version({ version, changes, title }: Changelog) {
  return (
    <section>
      <header>
        {!!title && <p className="italic">{title}</p>}
        <h3 className="text-lg">Version {version}:</h3>
      </header>
      <ul>
        {changes.map((change) => (
          <li
            className="before:content-['-'] before:mr-2"
            key={version + change}
          >
            {change}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Version;
