const SECTION_HEADINGS = new Set([
  "Summary",
  "Education",
  "Technical Skills",
  "Projects",
  "Experience",
  "Leadership & Awards",
  "Resume Highlights",
  "Extracted Resume Text",
  "Awards",
  "Certifications"
]);

const RewritePreview = ({ text }) => {
  const lines = text.split(/\r?\n/);
  const contentIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0)
    .map(({ index }) => index);
  const firstContentIndex = contentIndexes[0];
  const secondContentIndex = contentIndexes[1];

  return (
    <article className="bg-white px-5 py-6 sm:px-8 sm:py-7">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) {
          return <div key={index} className="h-3" />;
        }

        if (index === firstContentIndex) {
          return (
            <h2
              key={index}
              className="text-center font-serif text-2xl font-bold leading-tight text-zinc-950"
            >
              {line}
            </h2>
          );
        }

        if (index === secondContentIndex) {
          return (
            <p
              key={index}
              className="mt-1 text-center font-serif text-sm leading-6 text-zinc-700"
            >
              {line}
            </p>
          );
        }

        if (SECTION_HEADINGS.has(line)) {
          return (
            <h3
              key={index}
              className="mt-5 border-b border-zinc-300 pb-1 font-serif text-lg font-bold leading-tight text-zinc-950"
            >
              {line}
            </h3>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <p
              key={index}
              className="ml-4 font-serif text-sm leading-6 text-zinc-800"
            >
              <span className="mr-2">-</span>
              {line.slice(2)}
            </p>
          );
        }

        const labelMatch = line.match(/^([^:]{2,32}):\s*(.*)$/);

        if (labelMatch) {
          return (
            <p key={index} className="font-serif text-sm leading-6 text-zinc-800">
              <span className="font-bold text-zinc-950">{labelMatch[1]}:</span>{" "}
              {labelMatch[2]}
            </p>
          );
        }

        return (
          <p key={index} className="font-serif text-sm leading-6 text-zinc-800">
            {line}
          </p>
        );
      })}
    </article>
  );
};

export default RewritePreview;
