import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FeeAssignment {
    studentId: StudentId;
    academicYear: string;
    feeCategoryId: FeeCategoryId;
}
export type Time = bigint;
export type PaymentId = bigint;
export type FeeCategoryId = bigint;
export interface Payment {
    paymentMethod: string;
    studentId: StudentId;
    referenceNumber: string;
    date: Time;
    feeCategoryId: FeeCategoryId;
    notes: string;
    amount: bigint;
}
export interface FeeCategory {
    name: string;
    frequency: Frequency;
    amount: bigint;
}
export type StudentId = bigint;
export interface UserProfile {
    name: string;
}
export interface Student {
    name: string;
    email: string;
    grade: string;
    enrollmentDate: Time;
    phone: string;
    parentName: string;
}
export enum Frequency {
    annual = "annual",
    monthly = "monthly",
    termly = "termly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignFee(studentId: StudentId, feeCategoryId: FeeCategoryId, academicYear: string): Promise<bigint>;
    createFeeCategory(category: FeeCategory): Promise<FeeCategoryId>;
    getAllFeeCategories(): Promise<Array<FeeCategory>>;
    getAllStudents(): Promise<Array<Student>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeeAssignmentsByStudent(studentId: StudentId): Promise<Array<FeeAssignment>>;
    getFeeCategory(id: FeeCategoryId): Promise<FeeCategory>;
    getPaymentsByStudent(studentId: StudentId): Promise<Array<Payment>>;
    getStudent(id: StudentId): Promise<Student>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordPayment(payment: Payment): Promise<PaymentId>;
    registerStudent(student: Student): Promise<StudentId>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
