import { AddressForm, PersonForm } from '@/lib/visitorFormDefinition';
import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { JailBarangay, JailMunicipality, JailProvince, JailRegion } from "@/lib/definitions"
import { Input, Select, message } from 'antd';
import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "@/assets/location_marker.png"
import L from 'leaflet';

const customMarkerIcon = new L.Icon({
    iconUrl: markerIcon,
    iconSize: [25, 41], // Default size for Leaflet markers
    iconAnchor: [12, 41], // Anchor point of the icon
    popupAnchor: [1, -34], // Popup position relative to the icon
    shadowSize: [41, 41], // Default shadow size
});

type Country = {
    id: number;
    code: string;
    country: string
}

type Props = {
    handleAddressCancel: () => void;
    setPersonForm: Dispatch<SetStateAction<PersonForm>>;
    personForm: PersonForm;
    countries: Country[];
    provinces: JailProvince[];
    regions: JailRegion[];
    municipality: JailMunicipality[];
    barangay: JailBarangay[];
    editAddressIndex: number | null;
}

const FlyToLocation = ({ position }: { position: [number, number] | null }) => {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 14);
            map.invalidateSize();
        }
    }, [position, map]);

    return null;
};

const AddAddress = ({ setPersonForm, handleAddressCancel, countries, provinces, regions, municipality, barangay, editAddressIndex, personForm }: Props) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filtered lists based on selections
    const [filteredProvinces, setFilteredProvinces] = useState<JailProvince[]>([]);
    const [filteredMunicipalities, setFilteredMunicipalities] = useState<JailMunicipality[]>([]);
    const [filteredBarangays, setFilteredBarangays] = useState<JailBarangay[]>([]);

    const [addressForm, setAddressForm] = useState<AddressForm>(() => {
        if (editAddressIndex !== null && personForm?.address_data?.[editAddressIndex]) {
            // We're editing, use the existing data
            return { ...personForm?.address_data[editAddressIndex] };
        }
        // We're adding a new address, use default values
        return {
            type: "Home",
            barangay_id: null,
            municipality_id: null,
            country_id: 128,
            is_active: true,
            is_current: false,
            postal_code: "",
            province_id: null,
            record_status_id: 1,
            region_id: null,
            street: "",
            street_number: "",
            building_subdivision: "",
            latitude: "",
            longitude: "",
            remarks: "",
        };
    });

    // Reset form when editing status changes
    useEffect(() => {
        if (editAddressIndex !== null && personForm.address_data && personForm.address_data[editAddressIndex]) {
            setAddressForm({ ...personForm.address_data[editAddressIndex] });
        } else {
            // Reset to default values for new address
            setAddressForm({
                type: "Home",
                barangay_id: null,
                municipality_id: null,
                country_id: 128,
                is_active: true,
                is_current: false,
                postal_code: "",
                province_id: null,
                record_status_id: 1,
                region_id: null,
                street: "",
                street_number: "",
                building_subdivision: "",
                latitude: "",
                longitude: "",
                remarks: "",
            });
        }
    }, [editAddressIndex, personForm.address_data]);

    // Update filtered provinces when region changes
    useEffect(() => {
        if (addressForm.region_id) {
            const filtered = provinces.filter(province => province.region === addressForm.region_id);
            setFilteredProvinces(filtered);

            // If selected province is not in the filtered list, reset it
            if (addressForm.province_id && !filtered.some(p => p.id === addressForm.province_id)) {
                setAddressForm(prev => ({
                    ...prev,
                    province_id: null,
                    municipality_id: null,
                    barangay_id: null
                }));
            }
        } else {
            setFilteredProvinces([]);
        }
    }, [addressForm?.region_id, provinces, addressForm?.province_id]);

    // Update filtered municipalities when province changes
    useEffect(() => {
        if (addressForm.province_id) {
            const filtered = municipality.filter(muni => muni.province === addressForm.province_id);
            setFilteredMunicipalities(filtered);

            // If selected municipality is not in the filtered list, reset it
            if (addressForm.municipality_id && !filtered.some(m => m.id === addressForm.municipality_id)) {
                setAddressForm(prev => ({
                    ...prev,
                    municipality_id: null,
                    barangay_id: null
                }));
            }
        } else {
            setFilteredMunicipalities([]);
        }
    }, [addressForm?.province_id, municipality, addressForm?.municipality_id]);

    // Update filtered barangays when municipality changes
    useEffect(() => {
        if (addressForm.municipality_id) {
            const filtered = barangay.filter(brgy => brgy.municipality === addressForm.municipality_id);
            setFilteredBarangays(filtered);

            // If selected barangay is not in the filtered list, reset it
            if (addressForm.barangay_id && !filtered.some(b => b.id === addressForm.barangay_id)) {
                setAddressForm(prev => ({
                    ...prev,
                    barangay_id: null
                }));
            }
        } else {
            setFilteredBarangays([]);
        }
    }, [addressForm?.municipality_id, barangay, addressForm?.barangay_id]);

    // Initialize filtered lists on form load
    useEffect(() => {
        // If we're editing and have initial values, set the filtered lists accordingly
        if (addressForm.region_id) {
            setFilteredProvinces(provinces.filter(province => province.region === addressForm.region_id));

            if (addressForm.province_id) {
                setFilteredMunicipalities(municipality.filter(muni => muni.province === addressForm.province_id));

                if (addressForm.municipality_id) {
                    setFilteredBarangays(barangay.filter(brgy => brgy.municipality === addressForm.municipality_id));
                }
            }
        }
    }, []);

    useEffect(() => {
        if (addressForm?.latitude && addressForm?.longitude) {
            const lat = parseFloat(addressForm.latitude as string);
            const lng = parseFloat(addressForm.longitude as string);
            if (!isNaN(lat) && !isNaN(lng)) {
                setPosition([lat, lng]);
            }
        }
    }, [addressForm?.latitude, addressForm?.longitude]);

    const address = [
        addressForm?.building_subdivision,
        addressForm?.street,
        filteredBarangays.find(brgy => brgy?.id === addressForm?.barangay_id)?.desc,
        filteredMunicipalities.find(municipality => municipality?.id === addressForm?.municipality_id)?.desc,
        filteredProvinces.find(province => province?.id === addressForm?.province_id)?.desc,
        regions.find(region => region?.id === addressForm?.region_id)?.desc,
        "Philippines",
    ]
        .filter(Boolean)
        .join(", ");

    useEffect(() => {
        if (!address) return;

        const timer = setTimeout(() => {
            const encoded = encodeURIComponent(address);
            const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1`;

            fetch(url, {
                headers: {
                    "User-Agent": "your-app-name (your@email.com)",
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.length > 0) {
                        const loc = data[0];
                        const latNum = parseFloat(loc.lat);
                        const lonNum = parseFloat(loc.lon);

                        setPosition([latNum, lonNum]);
                        setAddressForm(prev => ({ ...prev, latitude: latNum.toFixed(5) }))
                        setAddressForm(prev => ({ ...prev, longitude: lonNum.toFixed(5) }))
                    }
                })
                .catch((err) => console.error("Geocoding error:", err));
        }, 1000);

        return () => clearTimeout(timer);
    }, [address]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Check required fields
        if (!addressForm.type) newErrors.type = "Address type is required";
        if (!addressForm.region_id) newErrors.region_id = "Region is required";
        if (!addressForm.province_id) newErrors.province_id = "Province is required";
        if (!addressForm.municipality_id) newErrors.municipality_id = "City/Municipality is required";
        if (!addressForm.barangay_id) newErrors.barangay_id = "Barangay is required";
        if (!addressForm.country_id) newErrors.country_id = "Country is required";

        setErrors(newErrors);

        // If there are any errors
        if (Object.keys(newErrors).length > 0) {
            const errorMessage = Object.values(newErrors).join(', ');
            message.error({
                content: `Please fill in all required fields: ${errorMessage}`,
                duration: 5
            });
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }
        // Build full_address by joining non-empty address parts
        const full_address = [
            addressForm?.building_subdivision,
            addressForm?.street,
            filteredBarangays.find(brgy => brgy?.id === addressForm?.barangay_id)?.desc,
            filteredMunicipalities.find(municipality => municipality?.id === addressForm?.municipality_id)?.desc,
            filteredProvinces.find(province => province?.id === addressForm?.province_id)?.desc,
            regions.find(region => region?.id === addressForm?.region_id)?.desc,
            countries.find(country => country?.id === addressForm?.country_id)?.country,
        ]
            .filter(Boolean)
            .join(", ");

        setPersonForm(prev => {
            const currentAddressData = Array.isArray(prev.address_data) ? [...prev.address_data] : [];
            const addressWithFull = { ...addressForm, full_address };

            if (editAddressIndex !== null) {
                currentAddressData[editAddressIndex] = addressWithFull;
                return {
                    ...prev,
                    address_data: currentAddressData,
                };
            } else {
                return {
                    ...prev,
                    address_data: [...currentAddressData, addressWithFull],
                };
            }
        });
        // Reset the address form to default values
        setAddressForm({
            type: "Home",
            barangay_id: null,
            municipality_id: null,
            country_id: 128,
            is_active: true,
            is_current: false,
            postal_code: "",
            province_id: null,
            record_status_id: 1,
            region_id: null,
            street: "",
            street_number: "",
            building_subdivision: "",
            latitude: "",
            longitude: "",
            remarks: "",
        });

        message.success(editAddressIndex !== null ? "Address updated successfully" : "Address added successfully");
        handleAddressCancel();
    };


    const handleCancel = () => {
        // Reset the form when canceling
        setAddressForm({
            type: "Home",
            barangay_id: null,
            municipality_id: null,
            country_id: 128,
            is_active: true,
            is_current: false,
            postal_code: "",
            province_id: null,
            record_status_id: 1,
            region_id: null,
            street: "",
            street_number: "",
            building_subdivision: "",
            latitude: "",
            longitude: "",
            remarks: "",
        });
        handleAddressCancel();
    };


    return (
        <div>
            <form className='p-5'>
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col lg:flex-row gap-5">
                        {/* Address Type */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>Address Type <p className="text-red-600">*</p></div>
                            <Select
                                value={addressForm?.type}
                                status={errors.type ? "error" : ""}
                                className='mt-2 h-10 rounded-md outline-gray-300 w-full'
                                options={[
                                    { value: 'Home', label: 'Home' },
                                    { value: 'Work', label: 'Work' },
                                    { value: 'Other', label: 'Other' },
                                ]}
                                onChange={(value: "Home" | "Work" | "Other") => {
                                    setAddressForm(prev => (
                                        {
                                            ...prev,
                                            type: value
                                        }
                                    ));
                                    if (errors.type) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.type;
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                        </div>

                        {/* Region */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>Region<p className="text-red-600">*</p></div>
                            <Select
                                value={addressForm?.region_id}
                                status={errors.region_id ? "error" : ""}
                                showSearch
                                optionFilterProp="label"
                                className='mt-2 h-10 rounded-md outline-gray-300 w-full'
                                options={regions?.map(region => ({
                                    value: region?.id,
                                    label: region?.desc
                                }))}
                                onChange={(value) => {
                                    setAddressForm(prev => (
                                        {
                                            ...prev,
                                            region_id: value,
                                            province_id: null,
                                            municipality_id: null,
                                            barangay_id: null
                                        }
                                    ));
                                    if (errors.region_id) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.region_id;
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                        </div>

                        {/* Province */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>Province<p className="text-red-600">*</p></div>
                            <Select
                                value={addressForm?.province_id}
                                status={errors.province_id ? "error" : ""}
                                showSearch
                                optionFilterProp="label"
                                disabled={!addressForm.region_id}
                                className='mt-2 h-10 rounded-md outline-gray-300 w-full'
                                options={filteredProvinces
                                    // Filter out "Cotabato" if NCR is selected. Remind backend to remove it.
                                    .filter(province =>
                                        !(regions.find(r => r.id === addressForm.region_id)?.desc === "National Capital Region (NCR)" &&
                                            province.desc?.toLowerCase().includes("cotabato"))
                                    )
                                    .map((province) => ({
                                        value: province?.id,
                                        label: province?.desc,
                                    }))
                                }
                                onChange={(value) => {
                                    setAddressForm(prev => (
                                        {
                                            ...prev,
                                            province_id: value,
                                            municipality_id: null,
                                            barangay_id: null
                                        }
                                    ));
                                    if (errors.province_id) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.province_id;
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                        </div>

                        {/* Provincial District */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>Provincial District</div>
                            <select className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300 bg-gray-100'>
                                <option value=""></option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-5">
                        {/* City / Municipality */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>City / Municipality<p className="text-red-600">*</p></div>
                            <Select
                                value={addressForm?.municipality_id}
                                status={errors.municipality_id ? "error" : ""}
                                showSearch
                                optionFilterProp="label"
                                disabled={!addressForm.province_id}
                                className='mt-2 h-10 rounded-md outline-gray-300 w-full'
                                options={filteredMunicipalities?.map((municipality) => ({
                                    value: municipality?.id,
                                    label: municipality?.desc,
                                }))}
                                onChange={(value) => {
                                    setAddressForm(prev => (
                                        {
                                            ...prev,
                                            municipality_id: value,
                                            barangay_id: null
                                        }
                                    ));
                                    if (errors.municipality_id) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.municipality_id;
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                        </div>

                        {/*  District */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'> District<p className="text-red-600">*</p></div>
                            <Input
                                className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300'
                                value={filteredMunicipalities.find(municipality => municipality?.id === addressForm?.municipality_id)?.legist_dist || ""}
                                readOnly
                            />
                        </div>

                        {/* Barangay */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>Barangay<p className="text-red-600">*</p></div>
                            <Select
                                value={addressForm?.barangay_id}
                                status={errors.barangay_id ? "error" : ""}
                                showSearch
                                optionFilterProp="label"
                                disabled={!addressForm.municipality_id}
                                className='mt-2 h-10 rounded-md outline-gray-300 w-full'
                                options={filteredBarangays?.map((brgy) => ({
                                    value: brgy?.id,
                                    label: brgy?.desc,
                                }))}
                                onChange={(value) => {
                                    setAddressForm(prev => (
                                        {
                                            ...prev,
                                            barangay_id: value
                                        }
                                    ));
                                    if (errors.barangay_id) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.barangay_id;
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                        </div>

                        {/*  Street */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'> Street</div>
                            <Input
                                value={addressForm?.street ?? ""}
                                className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300'
                                onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                            />

                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-5">
                        {/*  Street No. */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'> Street No.</div>
                            <Input
                                value={addressForm?.street_number ?? ""}
                                className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300'
                                onChange={(e) => setAddressForm(prev => ({ ...prev, street_number: e.target.value }))}
                            />
                        </div>

                        {/*  Building Subdivision */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'> Building Subdivision</div>
                            <Input
                                value={addressForm?.building_subdivision ?? ""}
                                className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300'
                                onChange={(e) => setAddressForm(prev => ({ ...prev, building_subdivision: e.target.value }))}
                            />
                        </div>

                        {/*  Postal / Zip Code */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'> Postal / Zip Code</div>
                            <Input
                                value={addressForm?.postal_code ?? ""}
                                className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300'
                                onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                            />
                        </div>

                        {/* Country */}
                        <div className='mt-2 w-full'>
                            <div className='flex gap-1 font-semibold'>Country<p className="text-red-600">*</p></div>
                            <Select
                                value={addressForm?.country_id}
                                status={errors.country_id ? "error" : ""}
                                showSearch
                                optionFilterProp="label"
                                className='mt-2 h-10 rounded-md outline-gray-300 w-full'
                                options={countries?.map((country) => ({
                                    value: country?.id,
                                    label: country?.country,
                                }))}
                                onChange={(value) => {
                                    setAddressForm(prev => (
                                        {
                                            ...prev,
                                            country_id: value
                                        }
                                    ));
                                    if (errors.country_id) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.country_id;
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-5 flex-wrap items-center">
                        <div className="flex gap-5 items-center">
                            <p className="font-semibold">Current Address</p>
                            <input
                                type="checkbox"
                                onChange={() => setAddressForm(prev => ({ ...prev, is_current: !prev.is_current }))}
                                checked={addressForm?.is_current ?? false}
                            />
                        </div>
                        <div className="flex gap-5 items-center">
                            <p className="font-semibold">Address is Active?</p>
                            <input
                                type="checkbox"
                                onChange={() => setAddressForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                                checked={addressForm?.is_active ?? false}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-5">
                        <div className="w-full lg:w-1/2">
                            <p className="font-semibold">Location</p>
                            <div className="!w-full border rounded-md mt-2 !h-[290px]">
                                <MapContainer center={[14.6760, 121.0437]} zoom={5} style={{ height: "290px", width: "100%" }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <FlyToLocation position={position} />
                                    {position && <Marker position={position} icon={customMarkerIcon} />}
                                </MapContainer>
                            </div>
                            <div className="flex items-center gap-5">
                                <div className="flex gap-5 items-center">
                                    <p className="font-semibold">Latitude</p>
                                    <input
                                        readOnly
                                        value={addressForm?.latitude || ""}
                                        className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300 bg-gray-100'
                                    />
                                </div>
                                <div className="flex gap-5 items-center">
                                    <p className="font-semibold">Longitude</p>
                                    <input
                                        readOnly
                                        value={addressForm?.longitude || ""}
                                        className='mt-2 w-full px-3 py-2 rounded-md outline-gray-300 bg-gray-100'
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-full lg:w-1/2">
                            <p className="font-semibold">Notes / Remarks</p>
                            <Input.TextArea
                                className='mt-2 w-full !h-72 px-3 py-2 rounded-md outline-gray-300'
                                value={addressForm?.remarks || ""}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, remarks: e.target.value }))}
                            />
                            <div className="flex gap-5 mt-2 float-right">
                                <button
                                    type="button"
                                    className="bg-blue-500 text-white rounded-md py-2 px-6"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="bg-blue-500 text-white rounded-md py-2 px-6"
                                    onClick={handleSubmit}
                                >
                                    {editAddressIndex !== null ? "Update" : "Add"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AddAddress