/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateAge } from "@/functions/calculateAge";
import { getPDLVisitStatuses } from "@/lib/additionalQueries";
import {
    getCivilStatus,
    getCountries,
    getCourtBranches,
    getCrimeCategories,
    getCurrentUser,
    getDetention_Building,
    getDetention_Floor,
    getDetentionCell,
    getEducationalAttainments,
    getEthnicityProvinces,
    getGangAffiliation,
    getGenders,
    getInterests,
    getJail_Barangay,
    getJail_Municipality,
    getJail_Province,
    getJailRegion,
    getLaws,
    getLooks,
    getMultipleBirthClassTypes,
    getNationalities,
    getOccupations,
    getPersonSearch,
    getPrecincts,
    getPrefixes,
    getReligion,
    getSkills,
    getSuffixes,
    getTalents,
    getUsers,
    getVisitor_to_PDL_Relationship,
} from "@/lib/queries";
import { BiometricRecordFace } from "@/lib/scanner-definitions";
import { BASE_URL, BIOMETRIC, PERSON } from "@/lib/urls";
import { PDLForm, PersonForm } from "@/lib/visitorFormDefinition";
import CaseDetails from "@/pages/visitor_management/pdl-data-entry/CaseDetails";
import EducAttainment from "@/pages/visitor_management/pdl-data-entry/EducAttainment";
import FMC from "@/pages/visitor_management/pdl-data-entry/FMC";
// import PdlVisitor from "@/pages/visitor_management/pdl-data-entry/PdlVisitor";
import AddAddress from "@/pages/visitor_management/visitor-data-entry/AddAddress";
import ContactForm from "@/pages/visitor_management/visitor-data-entry/ContactForm";
import Issue from "@/pages/visitor_management/visitor-data-entry/Issue";
import Remarks from "@/pages/visitor_management/visitor-data-entry/Remarks";
import VisitorProfile from "@/pages/visitor_management/visitor-data-entry/visitorprofile";
import { useTokenStore } from "@/store/useTokenStore";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { DatePicker, Input, message, Modal, Select, Table } from "antd";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { ColumnsType } from "antd/es/table";
// import ExistingVisitor from "./ExistingVisitor";
import Spinner from "@/components/loaders/Spinner";
import UpdateMultipleBirthSiblings from "./UpdateMultiBirthSibling";
import UpdatePdlVisitor from "./UpdatePdlVisitor";
import { EthnicityProvince } from "@/lib/definitions";
import { Person } from "@/lib/pdl-definitions";
import { EnrolledBiometrics } from "@/pages/visitor_management/edit-visitor/EditVisitor";

const patchPerson = async (payload: PersonForm, token: string, id: string) => {
    const res = await fetch(`${PERSON.postPERSON}${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData) || "Error patching person");
    }

    return res.json();
};

const patchPdl = async (pdl: PDLForm, token: string, id: string) => {
    const res = await fetch(`${BASE_URL}/api/pdls/pdl/${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify(pdl),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData));
    }

    return res.json();
};

const enrollBiometrics = async (
    enrollForm: BiometricRecordFace
): Promise<any> => {
    const response = await fetch(BIOMETRIC.ENROLL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(enrollForm),
    });

    if (!response.ok) {
        throw new Error("Failed to enroll biometric data");
    }

    return response.json();
};

const UpdatePDL = () => {
    const token = useTokenStore()?.token;
    const location = useLocation();
    const pdl = location.state?.pdl;

    const {
        data: pdlData,
        error,
        isLoading,
    } = useQuery({
        queryKey: ["specific-pdl", pdl?.id],
        queryFn: async () => {
            const response = await fetch(`${BASE_URL}/api/pdls/pdl/${pdl.id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(JSON.stringify(error));
            }

            return response.json();
        },
        enabled: !!pdl?.id && !!token,
    });

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    const [editAddressIndex, setEditAddressIndex] = useState<number | null>(null);
    const [editContactIndex, setEditContactIndex] = useState<number | null>(null);

    const [personForm, setPersonForm] = useState<PersonForm>({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: null,
        prefix: null,
        shortname: "",
        gender_id: null,
        date_of_birth: "",
        place_of_birth: "",
        nationality_id: null,
        civil_status_id: null,
        address_data: [],
        contact_data: [],
        employment_history_data: [],
        education_background_data: [],
        social_media_account_data: [],
        skill_id: [],
        talent_id: [],
        interest_id: [],
        media_identifier_data: [],
        media_requirement_data: [],
        diagnosis_data: [],
        religion_id: 1,
        media_data: [],
        multiple_birth_sibling_data: [],
    });
    const [pdlForm, setPdlForm] = useState<PDLForm>({
        date_of_admission: "2025-04-10",
        case_data: [],
        gang_affiliation_id: null,
        jail_id: 1,
        org_id: 1,
        occupation_id: null,
        person_id: null,
        status: "Committed",
        visitor_ids: [],
        pdl_alias: "",
        time_arrested: "",
        remarks_data: [],
        look_id: null,
        person_relationship_data: [],
        visitor: [],
        precinct_id: null,
        building_id: null,
        cell_id: null,
        floor_id: null,
        visitation_status_id: null,
        risk_classification: ""
    });


    const [personSearch, setPersonSearch] = useState("");
    const [personPage, setPersonPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState(personSearch);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(personSearch), 400);
        return () => clearTimeout(handler);
    }, [personSearch]);

    const {
        data: personsPaginated,
        isLoading: personsLoading,
    } = useQuery({
        queryKey: ['paginated-person', debouncedSearch, personPage],
        queryFn: () => getPersonSearch(token ?? "", 10, debouncedSearch, personPage),
        placeholderData: (previousData) => previousData,
        staleTime: 10 * 60 * 1000,
    });

    const [enrolledBiometrics, setEnrolledBiometrics] = useState<EnrolledBiometrics>({
        rightIrisIsEnrolled: false,
        leftIrisIsEnrolled: false,
        rightLittleIsEnrolled: false,
        rightRingIsEnrolled: false,
        rightMiddleIsEnrolled: false,
        rightIndexIsEnrolled: false,
        rightThumbIsEnrolled: false,
        leftLittleIsEnrolled: false,
        leftRingIsEnrolled: false,
        leftMiddleIsEnrolled: false,
        leftIndexIsEnrolled: false,
        leftThumbIsEnrolled: false,
        faceIsEnrolled: false,
    })

    const [icao, setIcao] = useState("");

    const [enrollFormFace, setEnrollFormFace] = useState<BiometricRecordFace>({
        remarks: "Test",
        person: 0,
        biometric_type: "face",
        position: "face",
        place_registered: "Quezon City",
        upload_data: icao ?? "",
    });

    const [enrollFormLeftIris, setEnrollFormLeftIris] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "iris",
            position: "iris_left",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollFormRightIris, setEnrollFormRightIris] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "iris",
            position: "iris_right",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollLeftLittleFinger, setEnrollLeftLittleFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint", // Always face for this case
            position: "finger_left_little", // Position for left little finger
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollLeftRingFinger, setEnrollLeftRingFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_left_ring",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollLeftMiddleFinger, setEnrollLeftMiddleFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_left_middle",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollLeftIndexFinger, setEnrollLeftIndexFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_left_index",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollRightLittleFinger, setEnrollRightLittleFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_right_little",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollRightRingFinger, setEnrollRightRingFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_right_ring",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollRightMiddleFinger, setEnrollRightMiddleFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_right_middle",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollRightIndexFinger, setEnrollRightIndexFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_right_index",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollLeftThumbFinger, setEnrollLeftThumbFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_left_thumb",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const [enrollRightThumbFinger, setEnrollRightThumbFinger] =
        useState<BiometricRecordFace>({
            remarks: "",
            person: 0,
            biometric_type: "fingerprint",
            position: "finger_right_thumb",
            place_registered: "Quezon City",
            upload_data: "",
        });

    const showAddressModal = () => {
        setIsAddressModalOpen(true);
    };

    const handleAddressCancel = () => {
        setIsAddressModalOpen(false);
    };

    const showContactModal = () => {
        setIsContactModalOpen(true);
    };

    const handleContactCancel = () => {
        setIsContactModalOpen(false);
    };

    //Edit Handlers
    const handleEditAddress = (index: number) => {
        setEditAddressIndex(index);
        setIsAddressModalOpen(true);
    };

    const handleEditContact = (index: number) => {
        setEditContactIndex(index);
        setIsContactModalOpen(true);
    };

    //Delete Handlers
    const handleDeleteAddress = (indexToDelete: number) => {
        setPersonForm((prev) => ({
            ...prev,
            address_data: prev?.address_data?.filter((_, i) => i !== indexToDelete),
        }));
    };

    const handleDeleteContact = (indexToDelete: number) => {
        setPersonForm((prev) => ({
            ...prev,
            contact_data: prev?.contact_data?.filter((_, i) => i !== indexToDelete),
        }));
    };

    const handleDeleteMultipleBirthSibling = (indexToDelete: number) => {
        setPersonForm((prev) => ({
            ...prev,
            multiple_birth_sibling_data: prev?.multiple_birth_sibling_data?.filter(
                (_, i) => i !== indexToDelete
            ),
        }));
    };

    const deleteRemarksByIndex = (index: number) => {
        setPdlForm((prev) => ({
            ...prev,
            remarks_data: prev?.remarks_data?.filter((_, i) => i !== index),
        }));
    };

    const dropdownOptions = useQueries({
        queries: [
            { queryKey: ["detention-cell-dorm"], queryFn: () => getDetentionCell(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["person-gender"], queryFn: () => getGenders(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["person-nationality"], queryFn: () => getNationalities(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["person-civil-status"], queryFn: () => getCivilStatus(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["religion"], queryFn: () => getReligion(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["regions"], queryFn: () => getJailRegion(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["provinces"], queryFn: () => getJail_Province(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["city/municipality"], queryFn: () => getJail_Municipality(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["barangays"], queryFn: () => getJail_Barangay(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["countries"], queryFn: () => getCountries(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["talents"], queryFn: () => getTalents(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["skills"], queryFn: () => getSkills(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["current-user"], queryFn: () => getCurrentUser(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["prefix"], queryFn: () => getPrefixes(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["suffix"], queryFn: () => getSuffixes(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["multiple-birth-class-types"], queryFn: () => getMultipleBirthClassTypes(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["interests"], queryFn: () => getInterests(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["detention-building-level"], queryFn: () => getDetention_Building(token ?? ""), staleTime: 10 * 60 * 1000 },
            { queryKey: ["detention-floor-annex"], queryFn: () => getDetention_Floor(token ?? ""), staleTime: 10 * 60 * 1000 },
        ],
    });


    const toExclude = ["Male", "LGBTQ + GAY / BISEXUAL"]

    const dorms = dropdownOptions?.[0]?.data?.results;
    const genders = dropdownOptions?.[1]?.data?.results?.filter(
        gender => !toExclude.includes(gender?.gender_option)
    );
    const nationalities = dropdownOptions?.[2]?.data?.results;
    const nationalitiesLoading = dropdownOptions?.[2]?.isLoading;
    const civilStatuses = dropdownOptions?.[3]?.data?.results;
    const religions = dropdownOptions?.[4]?.data?.results;
    const religionsLoading = dropdownOptions?.[4]?.isLoading;
    const regions = dropdownOptions?.[5]?.data?.results;
    const provinces = dropdownOptions?.[6]?.data?.results;
    const municipalities = dropdownOptions?.[7]?.data?.results;
    const barangays = dropdownOptions?.[8]?.data?.results;
    const countries = dropdownOptions?.[9]?.data?.results;
    const talents = dropdownOptions?.[10]?.data?.results;
    const talentsLoading = dropdownOptions?.[10]?.isLoading;
    const skills = dropdownOptions?.[11]?.data?.results;
    const skillsLoading = dropdownOptions?.[11]?.isLoading;
    const currentUser = dropdownOptions?.[12]?.data;
    const prefixes = dropdownOptions?.[13]?.data?.results;
    const prefixesLoading = dropdownOptions?.[13]?.isLoading;
    const suffixes = dropdownOptions?.[14]?.data?.results;
    const suffixesLoading = dropdownOptions?.[14]?.isLoading;
    const birthClassTypes = dropdownOptions?.[15]?.data?.results;
    const birthClassTypesLoading = dropdownOptions?.[15]?.isLoading;
    const interests = dropdownOptions?.[16]?.data?.results;
    const interestsLoading = dropdownOptions?.[16]?.isLoading;
    const levels = dropdownOptions?.[17]?.data?.results;
    const levelsLoading = dropdownOptions?.[17]?.isLoading;
    const annex = dropdownOptions?.[18]?.data?.results;
    const annexLoading = dropdownOptions?.[18]?.isLoading;

    const persons = useMemo(() => personsPaginated?.results || [], [personsPaginated]);
    const personsCount = personsPaginated?.count || 0;

    const { data: ethnicitiesProvinces, isLoading: ethnicitiesProvincesLoading } =
        useQuery({
            queryKey: ["enthinicity"],
            queryFn: () => getEthnicityProvinces(token ?? ""),
            staleTime: 10 * 60 * 1000,
        });

    const { data: gangAffiliation, isLoading: gangAffiliationLoading } = useQuery(
        {
            queryKey: ["gang-affiliation"],
            queryFn: () => getGangAffiliation(token ?? ""),
            staleTime: 10 * 60 * 1000,
        }
    );

    const { data: occupations, isLoading: occupationsLoading } = useQuery({
        queryKey: ["gang-occupations"],
        queryFn: () => getOccupations(token ?? ""),
        staleTime: 10 * 60 * 1000,
    });

    const { data: looks, isLoading: looksLoading } = useQuery({
        queryKey: ["looks"],
        queryFn: () => getLooks(token ?? ""),
        staleTime: 10 * 60 * 1000,
    });

    const { data: precincts, isLoading: precinctsLoading } = useQuery({
        queryKey: ["precincts"],
        queryFn: () => getPrecincts(token ?? ""),
        staleTime: 10 * 60 * 1000,
    });

    const { data: pdlVisitStatuses, isLoading: pdlVisitStatusesLoading } =
        useQuery({
            queryKey: ["visitation-statuses"],
            queryFn: () => getPDLVisitStatuses(token ?? ""),
            staleTime: 10 * 60 * 1000,
        });

    const { data: attainments } = useQuery({
        queryKey: ["education-attainment"],
        queryFn: () => getEducationalAttainments(token ?? ""),
        staleTime: 10 * 60 * 1000,
    });

    const { data: courtBranches } = useQuery({
        queryKey: ['court-branches'],
        queryFn: () => getCourtBranches(token ?? ""),
        staleTime: 10 * 60 * 1000,
    })

    const { data: crimeCategories } = useQuery({
        queryKey: ['crime-categories'],
        queryFn: () => getCrimeCategories(token ?? ""),
        staleTime: 10 * 60 * 1000,
    })

    const { data: laws } = useQuery({
        queryKey: ['laws'],
        queryFn: () => getLaws(token ?? ""),
        staleTime: 10 * 60 * 1000,
    })

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => getUsers(token ?? ""),
        staleTime: 10 * 60 * 1000,
    })

    const { data: relationships } = useQuery({
        queryKey: ['relationships'],
        queryFn: () => getVisitor_to_PDL_Relationship(token ?? ""),
        staleTime: 10 * 60 * 1000,
    })

    const enrollFaceMutation = useMutation({
        mutationKey: ["enroll-face-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollFormFace, person: id }),
        onSuccess: () => message.success("Successfully enrolled Face"),
        onError: () => message.error("Failed to Enroll Face"),
    });

    const enrollLeftMutation = useMutation({
        mutationKey: ["enroll-left-iris-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollFormLeftIris, person: id }),
        onSuccess: () => message.success("Successfully enrolled Left Iris"),
        onError: () => message.error("Failed to Enroll Left Iris"),
    });

    const enrollRightMutation = useMutation({
        mutationKey: ["enroll-right-iris-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollFormRightIris, person: id }),
        onSuccess: () => message.success("Successfully enrolled Right Iris"),
        onError: () => message.error("Failed to Enroll Right Iris"),
    });

    const enrollLeftLittleMutation = useMutation({
        mutationKey: ["enroll-left-little-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollLeftLittleFinger, person: id }),
        onSuccess: () =>
            message.success("Successfully enrolled Left Little Finger"),
        onError: () => message.error("Failed to Enroll Left Little Finger"),
    });

    const enrollLeftRingMutation = useMutation({
        mutationKey: ["enroll-left-ring-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollLeftRingFinger, person: id }),
        onSuccess: () => message.success("Successfully enrolled Left Ring Finger"),
        onError: () => message.error("Failed to Enroll Left Ring Finger"),
    });

    const enrollLeftMiddleMutation = useMutation({
        mutationKey: ["enroll-left-middle-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollLeftMiddleFinger, person: id }),
        onSuccess: () =>
            message.success("Successfully enrolled Left Middle Finger"),
        onError: () => message.error("Failed to Enroll Left Middle Finger"),
    });

    const enrollLeftIndexMutation = useMutation({
        mutationKey: ["enroll-left-index-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollLeftIndexFinger, person: id }),
        onSuccess: () => message.success("Successfully enrolled Left Index Finger"),
        onError: () => message.error("Failed to Enroll Left Index Finger"),
    });

    const enrollRightLittleMutation = useMutation({
        mutationKey: ["enroll-right-little-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollRightLittleFinger, person: id }),
        onSuccess: () =>
            message.success("Successfully enrolled Right Little Finger"),
        onError: () => message.error("Failed to Enroll Right Little Finger"),
    });

    const enrollRightRingMutation = useMutation({
        mutationKey: ["enroll-right-ring-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollRightRingFinger, person: id }),
        onSuccess: () => message.success("Successfully enrolled Right Ring Finger"),
        onError: () => message.error("Failed to Enroll Right Ring Finger"),
    });

    const enrollRightMiddleMutation = useMutation({
        mutationKey: ["enroll-right-middle-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollRightMiddleFinger, person: id }),
        onSuccess: () =>
            message.success("Successfully enrolled Right Middle Finger"),
        onError: () => message.error("Failed to Enroll Right Middle Finger"),
    });

    const enrollRightIndexMutation = useMutation({
        mutationKey: ["enroll-right-index-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollRightIndexFinger, person: id }),
        onSuccess: () =>
            message.success("Successfully enrolled Right Index Finger"),
        onError: () => message.error("Failed to Enroll Right Index Finger"),
    });

    const enrollLeftThumbMutation = useMutation({
        mutationKey: ["enroll-left-thuumb-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollLeftThumbFinger, person: id }),
        onSuccess: () => message.success("Successfully enrolled Left Thumb Finger"),
        onError: () => message.error("Failed to Enroll Left Thumb Finger"),
    });

    const enrollRightThumbMutation = useMutation({
        mutationKey: ["enroll-right-thumb-mutation"],
        mutationFn: (id: number) =>
            enrollBiometrics({ ...enrollRightThumbFinger, person: id }),
        onSuccess: () =>
            message.success("Successfully enrolled Right Thumb Finger"),
        onError: () => message.error("Failed to Enroll Right Thumb Finger"),
    });

    const patchPdlMutation = useMutation({
        mutationKey: ["patch-visitor"],
        mutationFn: () => patchPdl(pdlForm, token ?? "", pdlData?.id),
        onSuccess: () => message.success("Successfully registered PDL"),
        onError: (err) => message.error(err.message),
    });

    const patchPersonMutation = useMutation({
        mutationKey: ["patch-person-visitor"],
        mutationFn: () => patchPerson(personForm, token ?? "", pdlData?.person?.id),
        onSuccess: async () => {
            message?.success("Successfully Updated Person");
        },
        onError: (err) => {
            message?.error(err.message || "Something went wrong!");
        },
    });

    const handleUpdate = async () => {
        if (!pdlData?.person?.id) {
            message.error("Person ID is not available.");
            return;
        }

        try {
            // Patch basic info first
            await Promise.all([
                patchPdlMutation.mutateAsync(),
                patchPersonMutation.mutateAsync(),
            ]);

            // Config-driven biometric checks
            const biometricConfigs = [
                { form: enrollFormFace, enrolledKey: "faceIsEnrolled", mutation: enrollFaceMutation, label: "Face" },
                { form: enrollFormLeftIris, enrolledKey: "leftIrisIsEnrolled", mutation: enrollLeftMutation, label: "Left Iris" },
                { form: enrollFormRightIris, enrolledKey: "rightIrisIsEnrolled", mutation: enrollRightMutation, label: "Right Iris" },
                { form: enrollLeftLittleFinger, enrolledKey: "leftLittleIsEnrolled", mutation: enrollLeftLittleMutation, label: "Left Little Finger" },
                { form: enrollLeftRingFinger, enrolledKey: "leftRingIsEnrolled", mutation: enrollLeftRingMutation, label: "Left Ring Finger" },
                { form: enrollLeftMiddleFinger, enrolledKey: "leftMiddleIsEnrolled", mutation: enrollLeftMiddleMutation, label: "Left Middle Finger" },
                { form: enrollLeftIndexFinger, enrolledKey: "leftIndexIsEnrolled", mutation: enrollLeftIndexMutation, label: "Left Index Finger" },
                { form: enrollLeftThumbFinger, enrolledKey: "leftThumbIsEnrolled", mutation: enrollLeftThumbMutation, label: "Left Thumb Finger" },
                { form: enrollRightLittleFinger, enrolledKey: "rightLittleIsEnrolled", mutation: enrollRightLittleMutation, label: "Right Little Finger" },
                { form: enrollRightRingFinger, enrolledKey: "rightRingIsEnrolled", mutation: enrollRightRingMutation, label: "Right Ring Finger" },
                { form: enrollRightMiddleFinger, enrolledKey: "rightMiddleIsEnrolled", mutation: enrollRightMiddleMutation, label: "Right Middle Finger" },
                { form: enrollRightIndexFinger, enrolledKey: "rightIndexIsEnrolled", mutation: enrollRightIndexMutation, label: "Right Index Finger" },
                { form: enrollRightThumbFinger, enrolledKey: "rightThumbIsEnrolled", mutation: enrollRightThumbMutation, label: "Right Thumb Finger" },
            ];

            const enrollmentTasks = biometricConfigs.flatMap(({ form, enrolledKey, mutation, label }) => {
                if (form?.upload_data) {
                    if ((enrolledBiometrics as any)[enrolledKey]) {
                        message.info(`${label} is already enrolled. Skipping...`);
                        return [];
                    }
                    return [mutation.mutateAsync(pdlData.person.id)];
                }
                return [];
            });

            await Promise.all(enrollmentTasks);

            message.success("Successfully updated PDL information.");
        } catch (err) {
            console.error("Enrollment error:", err);
            message.error("Some enrollment steps failed.");
        }
    };

    const addressDataSource = personForm?.address_data?.map((address, index) => {
        return {
            key: index,
            type: address?.type,
            region: regions?.find((region) => region?.id === address?.region_id)
                ?.desc,
            province: provinces?.find(
                (province) => province?.id === address?.province_id
            )?.desc,
            municipality: municipalities?.find(
                (municipality) => municipality?.id === address?.municipality_id
            )?.desc,
            barangay: barangays?.find(
                (barangay) => barangay?.id === address?.barangay_id
            )?.desc,
            zip: address?.postal_code,
            country: countries?.find((country) => country?.id === address?.country_id)
                ?.country,
            current: address?.is_current ? "Yes" : "No",
            active: address?.is_active ? "Yes" : "No",
            actions: (
                <div className="flex gap-1.5 font-semibold transition-all ease-in-out duration-200 justify-center items-center">
                    <button
                        type="button"
                        onClick={() => handleEditAddress(index)}
                        className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white py-1 rounded w-10 h-10 flex items-center justify-center"
                    >
                        <AiOutlineEdit />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteAddress(index)}
                        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-1 rounded flex w-10 h-10 items-center justify-center"
                    >
                        <AiOutlineDelete />
                    </button>
                </div>
            ),
        };
    });

    const addressColumn: ColumnsType<{
        key: number;
        type: "Home" | "Work" | "Other";
        region: string | undefined;
        province: string | undefined;
        municipality: string | undefined;
        barangay: string | undefined;
        zip: string | null;
        country: string | undefined;
        current: string;
        active: string;
        actions: JSX.Element;
    }> = [
            {
                title: "Types",
                dataIndex: "type",
                key: "type",
            },
            {
                title: "Region",
                dataIndex: "region",
                key: "region",
            },
            {
                title: "Province",
                dataIndex: "province",
                key: "province",
            },
            {
                title: "City/Mun",
                dataIndex: "municipality",
                key: "municipality",
            },
            {
                title: "Barangay",
                dataIndex: "barangay",
                key: "barangay",
            },
            {
                title: "Zip Code",
                dataIndex: "zip",
                key: "zip",
            },
            {
                title: "Country",
                dataIndex: "country",
                key: "country",
            },
            {
                title: "Current (Y/N)",
                dataIndex: "current",
                key: "current",
            },
            {
                title: "Active (Y/N)",
                dataIndex: "active",
                key: "active",
            },
            {
                title: "Actions",
                dataIndex: "actions",
                key: "actions",
                align: "center",
            },
        ];

    const contactDataSource = personForm?.contact_data?.map((contact, index) => {
        return {
            key: index,
            contact_type: contact?.type,
            details: contact?.value,
            imei: contact?.mobile_imei,
            is_primary: contact?.is_primary ? "Yes" : "No",
            active: contact?.contact_status ? "Yes" : "No",
            remarks: contact?.remarks,
            actions: (
                <div className="flex gap-1.5 font-semibold transition-all ease-in-out duration-200 justify-center items-center">
                    <button
                        type="button"
                        onClick={() => handleEditContact(index)}
                        className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white py-1 rounded w-10 h-10 flex items-center justify-center"
                    >
                        <AiOutlineEdit />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteContact(index)}
                        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-1 rounded flex w-10 h-10 items-center justify-center"
                    >
                        <AiOutlineDelete />
                    </button>
                </div>
            ),
        };
    });
    const contactColumn: ColumnsType<{
        key: number;
        contact_type: string | null;
        details: string | null;
        imei: string | null;
        is_primary: string | null;
        active: string | null;
        remarks: string | null;
        actions: JSX.Element;
    }> = [
            {
                title: "Contact Type",
                dataIndex: "contact_type",
                key: "contact_type",
            },
            {
                title: "Details",
                dataIndex: "details",
                key: "details",
            },
            {
                title: "SIM Card IMEI",
                dataIndex: "imei",
                key: "imei",
            },
            {
                title: "Primary (Y/N)",
                dataIndex: "is_primary",
                key: "is_primary",
            },
            {
                title: "Active (Y/N)",
                dataIndex: "active",
                key: "active",
            },
            {
                title: "Notes / Remarks",
                dataIndex: "remarks",
                key: "remarks",
            },
            {
                title: "Actions",
                dataIndex: "actions",
                key: "actions",
                align: "center",
            },
        ];

    useEffect(() => {
        setPersonForm({
            first_name: pdlData?.person?.first_name ?? "",
            middle_name: pdlData?.person.middle_name ?? "",
            last_name: pdlData?.person.last_name ?? "",
            suffix: pdlData?.person.suffix ?? null,
            prefix: pdlData?.person.prefix ?? null,
            shortname: pdlData?.person.shortname ?? "",
            gender_id: pdlData?.person.gender?.id ?? null,
            date_of_birth: pdlData?.person.date_of_birth ?? "",
            place_of_birth: pdlData?.person.place_of_birth ?? "",
            nationality_id:
                nationalities?.find(
                    (nationality) =>
                        nationality?.nationality === pdlData?.person?.nationality
                )?.id ?? null,
            civil_status_id:
                civilStatuses?.find(
                    (civilStatus) =>
                        civilStatus?.status === pdlData?.person?.civil_status
                )?.id ?? null,
            address_data:
                pdlData?.person.addresses?.map(
                    (existingAddress: {
                        region: string;
                        province: string;
                        municipality: string;
                        barangay: string;
                        country: string;
                        postal_code: string;
                        is_current: boolean;
                    }) => ({
                        ...existingAddress,
                        region_id:
                            regions?.find(
                                (region) => region?.desc === existingAddress?.region
                            )?.id ?? null,
                        province_id:
                            provinces?.find(
                                (province) => province?.desc === existingAddress?.province
                            )?.id ?? null,
                        municipality_id:
                            municipalities?.find(
                                (municipality) =>
                                    municipality?.desc === existingAddress?.municipality
                            )?.id ?? null,
                        barangay_id:
                            barangays?.find(
                                (brgy) => brgy?.desc === existingAddress?.barangay
                            )?.id ?? null,
                        country_id:
                            countries?.find(
                                (country) => country?.country === existingAddress?.country
                            )?.id ?? null,
                        postal_code: existingAddress?.postal_code ?? null,
                        is_current: existingAddress?.is_current ?? false,
                    })
                ) ?? [],
            contact_data: pdlData?.person.contacts ?? [],
            employment_history_data: pdlData?.person.employment_histories ?? [],
            education_background_data:
                pdlData?.person.education_backgrounds?.map(
                    (educ_bg: { educational_attainment: string }) => ({
                        ...educ_bg,
                        educational_attainment_id:
                            attainments?.results?.find(
                                (attainment) =>
                                    attainment?.name === educ_bg?.educational_attainment
                            )?.id ?? null,
                    })
                ) ?? [],
            social_media_account_data: pdlData?.person.social_media_accounts ?? [],
            skill_id: pdlData?.person.skill ?? [],
            talent_id: pdlData?.person.talent ?? [],
            interest_id: pdlData?.person.interest ?? [],
            media_identifier_data: pdlData?.person.media_identifiers ?? [],
            media_requirement_data: pdlData?.person.media_requirements ?? [],
            diagnosis_data: pdlData?.person.diagnoses ?? [],
            religion_id: pdlData?.person.religion?.id ?? 1,
            media_data: pdlData?.person.media?.map((media: any) => ({
                ...media,
                media_base64: media?.media_binary
            })) ?? [],
            multiple_birth_sibling_data:
                pdlData?.person?.multiple_birth_siblings?.map((sibling: any) => ({
                    ...sibling,
                    full_name: sibling?.person,
                    sibling_person_id: +sibling?.sibling_person_id_display,
                    person_id: pdlData?.person?.id ?? null,
                    multiple_birth_sibling_id: birthClassTypes?.find(
                        (type) =>
                            type?.term_for_sibling_group === sibling?.multiple_birth_class
                    )?.id,
                })) ?? [],
            ethnicity_province: pdlData?.person?.ethnicity_province,
        });

        setPdlForm({
            file_no: pdlData?.cases?.[0]?.file_number ?? "",
            risk_classification: pdlData?.risk_classification ?? "",
            date_of_admission: pdlData?.date_of_admission ?? "2001-01-01",
            case_data:
                pdlData?.cases?.map(
                    (pdlCases: {
                        court_branch: any;
                        case_number: string;
                        offense: { id: number; crime_category: string };
                        name: string;
                        bail_recommended: number;
                        law: string;
                    }) => ({
                        judge: pdlCases?.court_branch?.judge ?? "",
                        court_branch_id:
                            courtBranches?.results?.find(
                                (court) => court?.branch === pdlCases?.court_branch?.branch
                            )?.id ?? null,
                        case_number: pdlCases?.case_number ?? "",
                        offense_id: pdlCases?.offense?.id ?? null,
                        crime_category_id:
                            crimeCategories?.results?.find(
                                (categories) =>
                                    categories?.crime_category_name ===
                                    pdlCases?.offense?.crime_category
                            )?.id ?? null,
                        court_name: pdlCases?.court_branch?.court ?? "",
                        bail_recommended: pdlCases?.bail_recommended ?? "",
                        law_id:
                            laws?.results?.find((law) => law?.name === pdlCases?.law)?.id ??
                            null,
                    })
                ) ?? [],
            gang_affiliation_id:
                gangAffiliation?.results?.find(
                    (affiliation) => affiliation?.name === pdlData?.gang_affiliation
                )?.id ?? null,
            jail_id: pdlData?.jail?.id ?? null,
            org_id: 1,
            occupation_id:
                occupations?.results?.find(
                    (occupation) => occupation?.name === pdlData?.occupation
                )?.id ?? null,
            status: pdlData?.status ?? "",
            pdl_alias: pdlData?.shortname ?? "",
            time_arrested: "",
            remarks_data:
                pdlData?.remarks?.map((remark: any) => ({
                    remarks: remark?.remarks ?? "N/A",
                    created_by: `${users?.results?.find((user) => user?.id === remark?.personnel)
                        ?.first_name ?? ""
                        } ${users?.results?.find((user) => user?.id === remark?.personnel)
                            ?.last_name ?? ""
                        }`,
                    created_at: pdlData?.updated_at ?? "",
                })) ?? [],
            look_id:
                looks?.results?.find((look) => look?.name === pdlData?.look)?.id ??
                null,
            person_relationship_data:
                pdlData?.person_relationships?.map(
                    (relationship: {
                        relationship: string;
                        is_contact_person: boolean;
                        remarks: string;
                        person: Person;
                    }) => ({
                        relationship_id:
                            relationships?.results?.find(
                                (relType) =>
                                    relType?.relationship_name === relationship?.relationship
                            )?.id ?? null,
                        is_contact_person: relationship?.is_contact_person,
                        remarks: relationship?.remarks ?? "",
                        person_id: relationship?.person?.id ?? "",
                        first_name: relationship?.person?.first_name ?? "",
                        middle_name: relationship?.person?.middle_name ?? "",
                        last_name: relationship?.person?.last_name,
                        address: `
                            ${relationship?.person?.addresses?.[0]?.region ?? ""}
                            ${relationship?.person?.addresses?.[0]?.province ?? ""} 
                            ${relationship?.person?.addresses?.[0]?.city_municipality ?? ""} 
                            ${relationship?.person?.addresses?.[0]?.barangay ?? ""}
                            ${relationship?.person?.addresses?.[0]?.street ?? ""}
                        `,
                        mobile_number: relationship?.person?.contacts?.[0]?.value
                    })
                ) ?? [],
            person_id: pdlData?.person?.id ?? null,
            visitor:
                pdlData?.visitor?.map((pdlVisitor: { id: any }) => ({
                    ...pdlVisitor,
                    visitor: pdlVisitor?.id,
                })) ?? [],
            visitor_ids: pdlData?.visitor?.map((pdlVisitor: { id: any }) => pdlVisitor.id) ?? [],
            precinct_id:
                precincts?.results?.find(
                    (precinct) =>
                        precinct?.precinct_name === pdlData?.precinct?.match(/.*?\)/)?.[0]
                )?.id ?? 1,
            building_id:
                levels?.find(
                    (lvl) =>
                        lvl?.bldg_name === pdlData?.cell?.floor?.match(/\(([^)]+)\)/)[1]
                )?.id ?? null,
            cell_id: pdlData?.cell?.id ?? null,
            floor_id:
                annex?.find(
                    (annex) => annex?.floor_name === pdlData?.cell?.floor?.replace(/\s*\([^)]*\)/g, "")
                )?.id ?? null,
            visitation_status_id:
                pdlVisitStatuses?.results?.find(
                    (status) => status?.name === pdlData?.visitation_status
                )?.id ?? 1,
        });
    }, [
        pdlData,
        courtBranches,
        regions,
        provinces,
        municipalities,
        barangays,
        countries,
        annex,
        attainments,
        civilStatuses,
        crimeCategories,
        gangAffiliation,
        laws,
        levels,
        looks,
        nationalities,
        occupations,
        pdlVisitStatuses,
        precincts,
        users,
        persons,
        relationships,
        birthClassTypes
    ]);

    const chosenGender = genders?.find(gender => gender?.id === personForm?.gender_id)?.gender_option || "";
    const paddedId = String(pdlData?.id ?? '').padStart(6, '0').slice(-6);
    const pdlNumberDisplay = `${pdlData?.date_of_admission?.replace(/-/g, "")}-${paddedId}`

    useEffect(() => {
        const short = `${personForm?.first_name?.[0] ?? ""}${personForm?.last_name?.[0] ?? ""
            }`;
        setPersonForm((prev) => ({ ...prev, shortname: short?.toUpperCase() }));
    }, [personForm?.first_name, personForm?.last_name]);

    if (isLoading) return <div><Spinner /></div>;
    if (error) return <div className="w-full h-[90vh] flex items-center justify-center">{error?.message}</div>;

    // console.log("PDL Data:", pdlData)
    // console.log("Person Form:", personForm)

    return (
        <div className="bg-white rounded-md shadow border border-gray-200 py-5 px-7 w-full mb-5">
            <h2 className="font-extrabold text-2xl">PDL Registration</h2>
            <form>
                <div className="mt-5 text-gray-700">
                    <h3 className="font-bold text-xl">PDL Information</h3>
                    <div className="flex flex-col w-full gap-2">
                        <div className="flex justify-end">
                            <div className="flex gap-2 w-[70%] items-end">
                                <div className="flex flex-col mt-2 w-full">
                                    <div className="flex gap-1 font-semibold">Level</div>
                                    <Select
                                        value={pdlForm?.building_id}
                                        showSearch
                                        optionFilterProp="label"
                                        loading={levelsLoading}
                                        className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                        options={levels?.map((level) => ({
                                            value: level?.id,
                                            label: level?.bldg_name,
                                        }))}
                                        onChange={(value) => {
                                            setPdlForm((prev) => ({
                                                ...prev,
                                                building_id: value,
                                            }));
                                        }}
                                    />
                                </div>
                                {/*Select Input Field */}
                                <div className="flex flex-col mt-2 w-full">
                                    <div className="flex gap-1 font-semibold">Annex</div>
                                    <Select
                                        value={pdlForm?.floor_id}
                                        showSearch
                                        loading={annexLoading}
                                        optionFilterProp="label"
                                        className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                        options={annex?.map((annex) => ({
                                            value: annex?.id,
                                            label: annex?.floor_name,
                                        }))}
                                        onChange={(value) => {
                                            setPdlForm((prev) => ({
                                                ...prev,
                                                floor_id: value,
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col mt-2 w-full">
                                    <div className="flex gap-1 font-semibold">Dorm</div>
                                    <Select
                                        value={pdlForm?.cell_id}
                                        showSearch
                                        optionFilterProp="label"
                                        className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                        options={dorms?.map((dorm) => ({
                                            value: dorm?.id,
                                            label: dorm?.cell_name,
                                        }))}
                                        onChange={(value) => {
                                            setPdlForm((prev) => ({
                                                ...prev,
                                                cell_id: value,
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col mt-2 w-full">
                                    <div className="flex gap-1 font-semibold">Status</div>
                                    <Select
                                        value={pdlForm?.status}
                                        showSearch
                                        optionFilterProp="label"
                                        className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                        options={[
                                            { value: "Under Trial", label: "Under Trial" },
                                            { value: "Convicted", label: "Convicted" },
                                            { value: "Released", label: "Released" },
                                            { value: "Hospitalized", label: "Hospitalized" },
                                            { value: "Committed", label: "Committed" },
                                        ]}
                                        onChange={(value) => {
                                            setPdlForm((prev) => ({
                                                ...prev,
                                                status: value,
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col mt-2 w-full">
                                    <div className="flex gap-1 font-semibold">Risk Classification</div>
                                    <Select
                                        value={pdlForm?.risk_classification}
                                        showSearch
                                        optionFilterProp="label"
                                        className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                        options={[
                                            { value: "Low Risk", label: "Low Risk" },
                                            { value: "Moderate Risk", label: "Moderate Risk" },
                                            { value: "High Risk", label: "High Risk" },
                                        ]}
                                        onChange={(value) => {
                                            setPdlForm((prev) => ({
                                                ...prev,
                                                risk_classification: value,
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    PDL No.<span className="text-red-600">*</span>
                                </div>
                                <Input
                                    readOnly
                                    placeholder={pdlNumberDisplay || "YYYY-MM-DD-XXXXXXX"}
                                    className="mt-2 h-10 rounded-md outline-gray-300"
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    File No.<p className="text-red-600">*</p>
                                </div>
                                <Input
                                    readOnly
                                    placeholder={pdlForm?.file_no || "YYYY-MM-DD-XXXXXXX"}
                                    className="mt-2 h-10 rounded-md outline-gray-300"
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">Date Arrested</div>
                                <Input
                                    value={pdlForm?.date_of_admission ?? "2001-01-01"}
                                    className="mt-2 px-3 py-2 rounded-md outline-gray-300"
                                    type="date"
                                    name="fname"
                                    placeholder=""
                                    required
                                    onChange={(e) =>
                                        setPdlForm((prev) => ({
                                            ...prev,
                                            date_of_admission: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">Jail Origin</div>
                                <Select
                                    value={pdlForm?.precinct_id}
                                    loading={precinctsLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={precincts?.results?.map((precinct) => ({
                                        value: precinct?.id,
                                        label: precinct?.precinct_name,
                                    }))}
                                    onChange={(value) => {
                                        setPdlForm((prev) => ({
                                            ...prev,
                                            precinct_id: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">Gang Affiliation</div>
                                <Select
                                    value={pdlForm?.gang_affiliation_id}
                                    loading={gangAffiliationLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={gangAffiliation?.results?.map((gang) => ({
                                        value: gang?.id,
                                        label: gang?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPdlForm((prev) => ({
                                            ...prev,
                                            gang_affiliation_id: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Visitation Status
                                </div>
                                <Select
                                    value={pdlForm?.visitation_status_id}
                                    loading={pdlVisitStatusesLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={pdlVisitStatuses?.results?.map((status) => ({
                                        value: status?.id,
                                        label: status?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPdlForm((prev) => ({
                                            ...prev,
                                            visitation_status_id: value,
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">Prefix</div>
                                <Select
                                    value={personForm?.prefix}
                                    loading={prefixesLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={prefixes?.map((prefix) => ({
                                        value: prefix?.id,
                                        label: prefix?.prefix,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            prefix: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[3]">
                                <div className="flex gap-1 font-semibold">
                                    Last Name<p className="text-red-600">*</p>
                                </div>
                                <Input
                                    value={personForm.last_name ?? ""}
                                    className="mt-2 px-3 py-2 rounded-md"
                                    type="text"
                                    name="lname"
                                    placeholder="Last Name"
                                    required
                                    onChange={(e) =>
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            last_name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[3]">
                                <div className="flex gap-1 font-semibold">
                                    First Name<p className="text-red-600">*</p>
                                </div>
                                <Input
                                    value={personForm.first_name ?? ""}
                                    className="mt-2 px-3 py-2 rounded-md outline-gray-300"
                                    type="text"
                                    name="fname"
                                    placeholder="First Name"
                                    required
                                    onChange={(e) =>
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            first_name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[3]">
                                <div className="flex gap-1 font-semibold">Middle Name</div>
                                <Input
                                    value={personForm.middle_name ?? ""}
                                    className="mt-2 px-3 py-2 rounded-md outline-gray-300"
                                    type="text"
                                    name="middle-name"
                                    placeholder="Middle Name"
                                    required
                                    onChange={(e) =>
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            middle_name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">Suffix</div>
                                <Select
                                    value={personForm?.suffix}
                                    loading={suffixesLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={suffixes?.map((suffix) => ({
                                        value: suffix?.id,
                                        label: suffix?.suffix,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            suffix: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[3]">
                                <div className="flex gap-1 font-semibold">
                                    Gender<p className="text-red-600">*</p>
                                </div>
                                <Select
                                    value={personForm?.gender_id}
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={genders?.map((gender) => ({
                                        value: gender?.id,
                                        label: gender?.gender_option,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            gender_id: value,
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex flex-col mt-2 flex-[3]">
                                <div className="flex gap-1 font-semibold">Short Name</div>
                                <Input
                                    className="mt-2 px-3 py-2 rounded-md outline-gray-300"
                                    type="text"
                                    name="short-name"
                                    placeholder="Short Name"
                                    required
                                    value={personForm.shortname ?? ""}
                                    readOnly
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[2]">
                                <div className="flex gap-1 font-semibold">
                                    Date of Birth<p className="text-red-600">*</p>
                                </div>
                                <DatePicker
                                    value={
                                        personForm.date_of_birth
                                            ? dayjs(personForm.date_of_birth)
                                            : null
                                    }
                                    placeholder="YYYY-MM-DD"
                                    className="mt-2 h-10 rounded-md outline-gray-300"
                                    onChange={(date) =>
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            date_of_birth: date ? date.format("YYYY-MM-DD") : "",
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Age<p className="text-red-600">*</p>
                                </div>
                                <Input
                                    className="mt-2 px-3 py-2 rounded-md outline-gray-300 bg-gray-100"
                                    type="text"
                                    name="middle-name"
                                    placeholder="Age"
                                    disabled
                                    value={calculateAge(personForm?.date_of_birth)}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[3]">
                                <div className="flex gap-1 font-semibold">
                                    Place of Birth<p className="text-red-600">*</p>
                                </div>
                                <Input
                                    value={personForm.place_of_birth ?? ""}
                                    className="mt-2 px-3 py-2 rounded-md outline-gray-300"
                                    type="text"
                                    name="birth-date"
                                    placeholder="Place of Birth"
                                    required
                                    onChange={(e) =>
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            place_of_birth: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[1.5]">
                                <div className="flex gap-1 font-semibold">
                                    Civil Status<p className="text-red-600">*</p>
                                </div>
                                <Select
                                    value={personForm?.civil_status_id}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={civilStatuses?.map((civilStatus) => ({
                                        value: civilStatus?.id,
                                        label: civilStatus?.status,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            civil_status_id: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-[2]">
                                <div className="flex gap-1 font-semibold">Religion</div>
                                <Select
                                    value={personForm?.religion_id}
                                    loading={religionsLoading}
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={religions?.map((religion) => ({
                                        value: religion?.id,
                                        label: religion?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            religion_id: value,
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Occupation<span className="text-red-600">*</span>
                                </div>
                                <Select
                                    value={pdlForm?.occupation_id}
                                    loading={occupationsLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={occupations?.results?.map((occupation) => ({
                                        value: occupation?.id,
                                        label: occupation?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPdlForm((prev) => ({
                                            ...prev,
                                            occupation_id: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Ethnicity<p className="text-red-600">*</p>
                                </div>
                                <Select
                                    value={personForm?.ethnicity_province}
                                    loading={ethnicitiesProvincesLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={ethnicitiesProvinces?.results?.map((ethnicity: EthnicityProvince) => ({
                                        value: ethnicity?.id,
                                        label: `${ethnicity?.ethnicity} - ${ethnicity?.province}`,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            ethnicity_province: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Skill<p className="text-red-600">*</p>
                                </div>
                                <Select
                                    value={personForm?.skill_id?.[0]}
                                    loading={skillsLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={skills?.map((skill) => ({
                                        value: skill?.id,
                                        label: skill?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            skill_id: value ? [value] : [],
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Talent<span className="text-red-600">*</span>
                                </div>
                                <Select
                                    value={personForm?.talent_id?.[0]}
                                    loading={talentsLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={talents?.map((talent) => ({
                                        value: talent?.id,
                                        label: talent?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            talent_id: value ? [value] : [],
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Interest<span className="text-red-600">*</span>
                                </div>
                                <Select
                                    value={personForm?.interest_id?.[0]}
                                    loading={interestsLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={interests?.map((interest) => ({
                                        value: interest?.id,
                                        label: interest?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            interest_id: value ? [value] : [],
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Looks<span className="text-red-600">*</span>
                                </div>
                                <Select
                                    value={pdlForm?.look_id}
                                    loading={looksLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={looks?.results?.map((look) => ({
                                        value: look?.id,
                                        label: look?.name,
                                    }))}
                                    onChange={(value) => {
                                        setPdlForm((prev) => ({
                                            ...prev,
                                            look_id: value,
                                        }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col mt-2 flex-1">
                                <div className="flex gap-1 font-semibold">
                                    Nationality <span className="text-red-600">*</span>
                                </div>
                                <Select
                                    value={personForm?.nationality_id}
                                    loading={nationalitiesLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    className="mt-2 h-10 rounded-md outline-gray-300 !bg-gray-100"
                                    options={nationalities
                                        ?.map((nationality) => ({
                                            value: nationality?.id,
                                            label: nationality?.nationality,
                                        }))
                                        .sort((a, b) => {
                                            if (a.label === "Filipino") return -1;
                                            if (b.label === "Filipino") return 1;
                                            return 0;
                                        })}
                                    onChange={(value) => {
                                        setPersonForm((prev) => ({
                                            ...prev,
                                            nationality_id: value,
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        <UpdateMultipleBirthSiblings
                            handleDeleteMultipleBirthSibling={
                                handleDeleteMultipleBirthSibling
                            }
                            prefixes={prefixes || []}
                            suffixes={suffixes || []}
                            genders={genders || []}
                            setPersonForm={setPersonForm}
                            personForm={personForm}
                            birthClassTypes={birthClassTypes || []}
                            birthClassTypesLoading={birthClassTypesLoading}
                            persons={persons || []}
                            personsLoading={personsLoading}
                            currentPersonId={pdlData?.person?.id}
                            setPersonPage={setPersonPage}
                            setPersonSearch={setPersonSearch}
                            personPage={personPage}
                            personsCount={personsCount}
                        />

                        <div className="flex flex-col gap-5 mt-10">
                            <div className="flex justify-between">
                                <h1 className="font-bold text-xl">Addresses</h1>
                                <button
                                    onClick={showAddressModal}
                                    className="flex gap-2 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-400"
                                    type="button"
                                >
                                    <Plus />
                                    Add Address
                                </button>
                            </div>
                            <div>
                                <Table
                                    className="border text-gray-200 rounded-md"
                                    dataSource={addressDataSource}
                                    columns={addressColumn}
                                    scroll={{ x: 800 }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-5 mt-10">
                            <div className="flex justify-between">
                                <h1 className="font-bold text-xl">Contact Details</h1>
                                <button
                                    type="button"
                                    className="flex gap-2 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-400"
                                    onClick={showContactModal}
                                >
                                    <Plus />
                                    Add Contact
                                </button>
                            </div>
                            <div>
                                <Table
                                    className="border text-gray-200 rounded-md"
                                    dataSource={contactDataSource}
                                    columns={contactColumn}
                                    scroll={{ x: 800 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <EducAttainment setPersonForm={setPersonForm} personForm={personForm} />

            <FMC
                prefixes={prefixes || []}
                suffixes={suffixes || []}
                persons={persons || []}
                personsLoading={personsLoading}
                pdlForm={pdlForm}
                setPdlForm={setPdlForm}
                setPersonPage={setPersonPage}
                setPersonSearch={setPersonSearch}
                personPage={personPage}
                personSearch={personSearch}
                personsCount={personsCount}
            />

            <Modal
                className="overflow-y-auto rounded-lg scrollbar-hide"
                title={editAddressIndex !== null ? "Edit Address" : "Add Address"}
                open={isAddressModalOpen}
                onCancel={handleAddressCancel}
                footer={null}
                width="70%"
            >
                <AddAddress
                    handleAddressCancel={handleAddressCancel}
                    setPersonForm={setPersonForm}
                    barangay={barangays || []}
                    countries={countries || []}
                    municipality={municipalities || []}
                    provinces={provinces || []}
                    regions={regions || []}
                    editAddressIndex={editAddressIndex}
                    personForm={personForm}
                />
            </Modal>

            <Modal
                centered
                className="overflow-y-auto rounded-lg scrollbar-hide"
                title={editContactIndex !== null ? "Edit Contact" : "Add Contact"}
                open={isContactModalOpen}
                onCancel={handleContactCancel}
                footer={null}
                width="30%"
                style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
                <ContactForm
                    setPersonForm={setPersonForm}
                    handleContactCancel={handleContactCancel}
                    editContactIndex={editContactIndex}
                    personForm={personForm}
                />
            </Modal>

            {/**Biometrics */}
            <VisitorProfile
                setEnrolledBiometrics={setEnrolledBiometrics}
                inputGender={chosenGender}
                visitorToEdit={pdlData}
                icao={icao}
                setIcao={setIcao}
                setPersonForm={setPersonForm}
                enrollFormLeftIris={enrollFormLeftIris}
                enrollFormRightIris={enrollFormRightIris}
                setEnrollFormFace={setEnrollFormFace}
                setEnrollFormLeftIris={setEnrollFormLeftIris}
                setEnrollFormRightIris={setEnrollFormRightIris}
                setEnrollLeftIndexFinger={setEnrollLeftIndexFinger}
                setEnrollLeftLittleFinger={setEnrollLeftLittleFinger}
                setEnrollLeftMiddleFinger={setEnrollLeftMiddleFinger}
                setEnrollLeftRingFinger={setEnrollLeftRingFinger}
                setEnrollLeftThumbFinger={setEnrollLeftThumbFinger}
                setEnrollRightIndexFinger={setEnrollRightIndexFinger}
                setEnrollRightLittleFinger={setEnrollRightLittleFinger}
                setEnrollRightMiddleFinger={setEnrollRightMiddleFinger}
                setEnrollRightRingFinger={setEnrollRightRingFinger}
                setEnrollRightThumbFinger={setEnrollRightThumbFinger}
            />

            <CaseDetails pdlForm={pdlForm} setPdlForm={setPdlForm} />

            {/* <ExistingVisitor visitors={pdlData?.visitor} /> */}

            <UpdatePdlVisitor pdlForm={pdlForm} setPdlForm={setPdlForm} />

            {/* <PdlVisitor pdlForm={pdlForm} setPdlForm={setPdlForm} /> */}

            <Issue />

            <Remarks
                visitorForm={pdlForm}
                deleteRemarksByIndex={deleteRemarksByIndex}
                currentUser={currentUser ?? null}
                setVisitorForm={setPdlForm}
            />

            <form>
                <div className="flex gap-2 mt-5">
                    <div className="flex flex-col gap-5 w-full">
                        <div className="flex items-center justify-end w-full gap-5">
                            <div className="flex gap-4 w-[30%] h-full items-end">
                                <button
                                    type="button"
                                    className="bg-blue-500 text-white rounded-md py-2 px-6 flex-1 opacity-0"
                                >
                                    View Profile
                                </button>
                                <button
                                    type="button"
                                    className="bg-blue-500 text-white rounded-md py-2 px-6 flex-1"
                                    onClick={handleUpdate}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UpdatePDL;
