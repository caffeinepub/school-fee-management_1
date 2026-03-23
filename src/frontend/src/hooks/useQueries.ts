import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FeeAssignment,
  FeeCategory,
  Payment,
  Student,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

// ---- User Profile ----
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ---- Students ----
export function useGetAllStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (student: Student) => {
      if (!actor) throw new Error("Actor not available");
      return actor.registerStudent(student);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ---- Fee Categories ----
export function useGetAllFeeCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<FeeCategory[]>({
    queryKey: ["feeCategories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFeeCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateFeeCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: FeeCategory) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createFeeCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeCategories"] });
    },
  });
}

// ---- Payments ----
export function useGetPaymentsByStudent(studentId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Payment[]>({
    queryKey: ["payments", studentId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPaymentsByStudent(studentId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Payment) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordPayment(payment);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["payments", variables.studentId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    },
  });
}

// ---- Fee Assignments ----
export function useGetFeeAssignmentsByStudent(studentId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<FeeAssignment[]>({
    queryKey: ["feeAssignments", studentId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeeAssignmentsByStudent(studentId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignFee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      feeCategoryId,
      academicYear,
    }: {
      studentId: bigint;
      feeCategoryId: bigint;
      academicYear: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignFee(studentId, feeCategoryId, academicYear);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["feeAssignments", variables.studentId.toString()],
      });
    },
  });
}

// ---- Bulk data for reports/balances ----
export function useAllPayments(studentCount: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Payment[]>({
    queryKey: ["allPayments", studentCount],
    queryFn: async () => {
      if (!actor || studentCount === 0) return [];
      const ids = Array.from({ length: studentCount }, (_, i) => BigInt(i));
      const results = await Promise.all(
        ids.map((id) => actor.getPaymentsByStudent(id)),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && studentCount > 0,
  });
}

export function useAllFeeAssignments(studentCount: number) {
  const { actor, isFetching } = useActor();
  return useQuery<FeeAssignment[]>({
    queryKey: ["allFeeAssignments", studentCount],
    queryFn: async () => {
      if (!actor || studentCount === 0) return [];
      const ids = Array.from({ length: studentCount }, (_, i) => BigInt(i));
      const results = await Promise.all(
        ids.map((id) => actor.getFeeAssignmentsByStudent(id)),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && studentCount > 0,
  });
}
