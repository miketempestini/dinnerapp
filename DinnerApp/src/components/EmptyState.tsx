type Props = {
  emoji: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ emoji, title, body, action }: Props) {
  return (
    <div className="text-center bg-white rounded-2xl shadow-soft border border-orange-100 p-10">
      <div className="text-5xl mb-3" aria-hidden>{emoji}</div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {body && <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
