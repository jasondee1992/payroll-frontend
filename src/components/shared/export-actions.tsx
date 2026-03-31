type ExportAction = {
  label: string;
};

type ExportActionsProps = {
  actions: ExportAction[];
};

export function ExportActions({ actions }: ExportActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="ui-button-secondary"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
