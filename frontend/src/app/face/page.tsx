import DashboardLayout from "@/components/layout/DashboardLayout";


export default function FacePage() {
    return (
        <DashboardLayout>

            <h1 className="text-2xl font-bold">
                Face Recognition
            </h1>

            <p className="mt-2 text-slate-500">
                Live face recognition module
            </p>

        </DashboardLayout>
    );
}