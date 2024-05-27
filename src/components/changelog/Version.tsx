import type { Changelog } from "./changelogs";

function Version({ version, changes, title }: Changelog) {
  return (
    <section>
      <header>
        {!!title && <p className="italic py-2 pl-2 -indent-2">{title}</p>}
        <h3 className="text-lg">Version {version}:</h3>
      </header>
      <ul className="list-outside list-disc pl-5">
        {changes.map((change) => (
          <li className="last:pb-2" key={version + change}>
            {change}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Version;
