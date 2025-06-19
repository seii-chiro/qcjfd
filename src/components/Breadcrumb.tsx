import { NavLink } from "react-router-dom";

export const Breadcrumb = ({ url }: { url: string }) => {
    const parts = url.split("/").filter(Boolean);

    return (
        <nav className="flex items-center gap-2">
            {parts.map((part, index) => {
                // Always include the part in the path
                const path = "/" + parts.slice(0, index + 1).join("/");

                // Don't render the 'jvms' part visually
                if (part === "jvms") return null;

                return (
                    <span key={index} className="flex items-center">
                        {index > 0 && <span className="mx-1">&gt;</span>}
                        <NavLink to={path} className="text-gray-600 hover:underline">
                            {part.replace(/_/g, " ").toUpperCase()}
                        </NavLink>
                    </span>
                );
            })}
        </nav>
    );
};
