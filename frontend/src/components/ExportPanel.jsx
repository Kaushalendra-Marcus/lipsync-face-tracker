import { DownloadIcon, FilmIcon, XIcon } from './icons';

/** Bottom export panel: separate pkl + preview buttons + output name.
 *  Result opens in a modal so the editor layout never shifts. */
export default function ExportPanel({ outName, onOutName, onExportPkl, onExportPreview, exporting, result, showResult, onCloseResult, onViewResult }) {
  return (
    <section className="panel export-panel accent-cyan">
      <h3>7. Export</h3>
      <div className="export-grid">
        <button className="export-pkl" onClick={onExportPkl} disabled={exporting}>
          <DownloadIcon /> Export .pkl (Annotations)
        </button>
        <button className="export-mp4" onClick={onExportPreview} disabled={exporting}>
          <FilmIcon /> Export Preview .mp4
        </button>
        <label className="fld inline">Output Name
          <input value={outName} onChange={(e) => onOutName(e.target.value)} placeholder="speaker" />
        </label>
        {result && !showResult && (
          <button className="wide ghost auto" onClick={onViewResult}>
            View last result
          </button>
        )}
      </div>
      {result && showResult && (
        <div className="modal-backdrop" onClick={onCloseResult}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>Export complete</b>
              <button className="tool-icon" onClick={onCloseResult} title="Close"><XIcon /></button>
            </div>
            <div className="dl-row">
              <a href={'/api/download/' + result.pkl_name}><DownloadIcon /> {result.pkl_name}</a>
              <a href={'/api/download/' + result.preview_name}><DownloadIcon /> {result.preview_name} (with audio)</a>
            </div>
            <video
              key={result.preview_name}
              src={'/api/download/' + result.preview_name}
              controls
              preload="auto"
              className="preview modal-video"
            />
          </div>
        </div>
      )}
    </section>
  );
}
