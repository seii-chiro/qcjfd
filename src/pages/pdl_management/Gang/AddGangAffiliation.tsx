import { BASE_URL} from "@/lib/urls";
import { useTokenStore } from "@/store/useTokenStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useState } from "react";

type AddGangAffiliationProps = {
    name: string;
    description: string;
    remarks: string;
}

const AddGangAffiliation = ({ onClose }: { onClose: () => void }) => {
    const token = useTokenStore().token;
    const [messageApi, contextHolder] = message.useMessage();
    const queryClient = useQueryClient();
    const [selectGangAffiliation, setSelectGangAffiliation] = useState<AddGangAffiliationProps>({
        name: '',
        description: '',
        remarks: ''
    });

    async function AddGangAffiliation(gang_affiliation: AddGangAffiliationProps) {
        const res = await fetch(`${BASE_URL}/api/pdls/gang-affiliations/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify(gang_affiliation),
        });
        if (!res.ok) {
            let errorMessage = "Error Adding Gang Affiliation";
            try {
                const errorData = await res.json();
                errorMessage =
                    errorData?.message ||
                    errorData?.error ||
                    JSON.stringify(errorData);
            } catch {
                errorMessage = "Unexpected error occurred";
            }
            throw new Error(errorMessage);
        }
        return res.json();
    }

    const GangAffiliationMutation = useMutation({
        mutationKey: ['gang-affiliation'],
        mutationFn: AddGangAffiliation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gang-affiliation'] });
            messageApi.success("Added successfully");
            onClose();
        },
        onError: (error) => {
            console.error(error);
            messageApi.error(error.message);
        },
    });

    const handleGangAffiliationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        GangAffiliationMutation.mutate(selectGangAffiliation);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
            const { name, value } = e.target;
            setSelectGangAffiliation(prevForm => ({
            ...prevForm,
            [name]: value,
            }));
        };

    return (
        <div>
        {contextHolder}
            <form onSubmit={handleGangAffiliationSubmit}>
                <div className="grid grid-cols-1 w-full gap-3">
                    <div>
                        <p className="text-gray-500 font-bold">Gang Affiliation:</p>
                        <input type="text" name="name" id="name" onChange={handleInputChange} placeholder="Gang Affiliation" className="h-12 border w-full border-gray-300 rounded-lg px-2" />
                    </div>
                    <div>
                        <p className="text-gray-500 font-bold">Description:</p>
                        <input type="text" name="description" id="description" onChange={handleInputChange} placeholder="Description" className="h-12 border border-gray-300 rounded-lg px-2 w-full" />
                    </div>
                    <div>
                        <p className="text-gray-500 font-bold">Remarks:</p>
                        <input type="text" name="remarks" id="remarks" onChange={handleInputChange} placeholder="Remarks" className="h-12 border border-gray-300 rounded-lg px-2 w-full" />
                    </div>
                </div>
                <div className="w-full flex justify-end mt-10">
                    <button type="submit" className="bg-blue-500 text-white w-36 px-3 py-2 rounded font-semibold text-base">
                    Submit
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddGangAffiliation
