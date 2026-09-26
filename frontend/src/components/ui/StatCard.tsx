interface Props {
    title: string;
    value: string | number;
    description?: string;
}


export default function StatCard({
    title,
    value,
    description,
}: Props) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

            <p className="text-sm text-slate-500">
                {title}
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
                {value}
            </p>

            {description && (
                <p className="mt-2 text-xs text-slate-500">
                    {description}
                </p>
            )}

        </div>
    );
}