import { GodotLink } from "../assets/components/link"

const User = () => {
    return (
        <div>
            <div className="text-gray-700 flex flex-wrap gap-2 md:gap-5">
                            <div className="border border-gray-200 p-5 w-96 h-fit shadow-sm hover:shadow-md rounded-md">
                                <GodotLink link="user" title="User" />
                                <GodotLink link="" title="User Profile" />
                            </div>                    
                        <div className="border border-gray-200 p-5 w-96 shadow-sm hover:shadow-md rounded-md">
                            <div className="mt-2">
                                <div className="ml-8">
                                    <GodotLink link="roles" title="Roles" />
                                    <GodotLink link="" title="Role Levels" />
                                    <GodotLink link="" title="Menu Items" />
                                    <GodotLink link="" title="Access Matrix" />
                                    <GodotLink link="user-otp-account" title="User OTP Account Lockout" />
                                    <GodotLink link="" title="User bridge / Junction" />
                                </div>
                            </div>
                        </div>
                </div>
        </div>
    )
}

export default User
