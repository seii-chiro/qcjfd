
import { BASE_URL } from "@/lib/urls";
import { useTokenStore } from "@/store/useTokenStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {  message } from "antd";
import { useState } from "react";

type AddMultiBirthProps = {
    classification: string,
    group_size: number| null,
    term_for_sibling_group: string,
    description: string
}
const AddMultiBirth = ({ onClose }: { onClose: () => void }) => {
    const token = useTokenStore().token;
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [multiBirthForm, setMultiBirthForm] =
    useState<AddMultiBirthProps>({
            classification: '',
            group_size: null,
            term_for_sibling_group: '',
            description: '',
        });

    const AddMultiBirth = async (multibirth: AddMultiBirthProps) => {
        const res = await fetch(`${BASE_URL}/api/standards/multiple-birth-class/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify(multibirth),
        });
        
        if (!res.ok) {
        let errorMessage = "Error Adding Multi Birth Class";
        
        try {
            const errorData = await res.json();
            errorMessage =
            errorData?.message || errorData?.error || JSON.stringify(errorData);
        } catch {
            errorMessage = "Unexpected error occurred";
        }
        
        throw new Error(errorMessage);
        }
        
        return res.json();
    };

    const multibirthMutation = useMutation({
        mutationKey: ["sibling-group"],
        mutationFn: AddMultiBirth,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["sibling-group"] });
            messageApi.success("Added successfully");
            onClose();
        },
        onError: (error: any) => {
            console.error(error);
            messageApi.error(error.message);
            },
        });

        const handleMultiBirthSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            multibirthMutation.mutate(multiBirthForm);
        };
    
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setMultiBirthForm(prevForm => ({
                ...prevForm,
                [name]: value,
            }));
        };
    
    return (
        <div>
        {contextHolder}
            <form onSubmit={handleMultiBirthSubmit}>
                <div className="flex flex-col gap-5">
                    <div>
                        <p>Classification:</p>
                        <input type="text" name="classification" id="classification" onChange={handleInputChange} placeholder="Multi Birth Classification" className="w-full h-12 border border-gray-300 rounded-lg px-2" />
                    </div>
                    <div>
                        <p>Group Size:</p>
                        <input type="number" name="group_size" id="group_size" onChange={handleInputChange} placeholder="Group Size" className="w-full h-12 border border-gray-300 rounded-lg px-2" />
                    </div>
                    <div>
                        <p>Term for Sibling Group:</p>
                        <input type="text" name="term_for_sibling_group" id="term_for_sibling_group" onChange={handleInputChange} placeholder="Term for Sibling Group" className="w-full h-12 border border-gray-300 rounded-lg px-2" />
                    </div>
                    <div>
                        <p>Description:</p>
                        <input type="text" name="description" id="description" onChange={handleInputChange} placeholder="Description" className="w-full h-12 border border-gray-300 rounded-lg px-2" />
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

export default AddMultiBirth
