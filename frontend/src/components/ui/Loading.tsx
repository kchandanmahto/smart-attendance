interface LoadingProps {
    text?: string;
}

export default function Loading({
    text = "Loading...",
}: LoadingProps) {
    return (
        <div className="flex min-h-40 items-center justify-center">
            <div className="text-sm text-slate-500">
                {text}
            </div>
        </div>
    );
}