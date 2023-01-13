export interface UserInterface {
    id: string
    name: string
    email: string
    accountType: string
    userType: string
}

export interface UserRole { }

enum UserAccountType {
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
    PROJECT_DEVELOPER = 'PROJECT_DEVELOPER',
}