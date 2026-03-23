import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type StudentId = Nat;
  type FeeCategoryId = Nat;
  type PaymentId = Nat;

  public type Frequency = { #annual; #termly; #monthly };

  public type Student = {
    name : Text;
    grade : Text;
    parentName : Text;
    phone : Text;
    email : Text;
    enrollmentDate : Time.Time;
  };

  public type FeeCategory = {
    name : Text;
    amount : Nat;
    frequency : Frequency;
  };

  public type FeeAssignment = {
    studentId : StudentId;
    feeCategoryId : FeeCategoryId;
    academicYear : Text;
  };

  public type Payment = {
    studentId : StudentId;
    feeCategoryId : FeeCategoryId;
    amount : Nat;
    date : Time.Time;
    paymentMethod : Text;
    referenceNumber : Text;
    notes : Text;
  };

  public type UserProfile = { name : Text };

  module Student {
    public func compare(s1 : Student, s2 : Student) : Order.Order {
      Text.compare(s1.name, s2.name);
    };
  };

  module FeeCategory {
    public func compare(f1 : FeeCategory, f2 : FeeCategory) : Order.Order {
      Text.compare(f1.name, f2.name);
    };
  };

  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  let studentMap = Map.empty<StudentId, Student>();
  let feeCategoryMap = Map.empty<FeeCategoryId, FeeCategory>();
  let feeAssignments = Map.empty<Nat, FeeAssignment>();
  let paymentMap = Map.empty<PaymentId, Payment>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextStudentId = 1;
  var nextFeeCategoryId = 1;
  var nextPaymentId = 1;
  var nextAssignmentId = 1;

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Please sign in first");
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuth(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerStudent(student : Student) : async StudentId {
    requireAuth(caller);
    let id = nextStudentId;
    nextStudentId += 1;
    studentMap.add(id, { student with enrollmentDate = Time.now() });
    id;
  };

  public query ({ caller }) func getStudent(id : StudentId) : async Student {
    requireAuth(caller);
    switch (studentMap.get(id)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student };
    };
  };

  public query ({ caller }) func getAllStudents() : async [Student] {
    requireAuth(caller);
    studentMap.values().toArray().sort();
  };

  public shared ({ caller }) func createFeeCategory(category : FeeCategory) : async FeeCategoryId {
    requireAuth(caller);
    let id = nextFeeCategoryId;
    nextFeeCategoryId += 1;
    feeCategoryMap.add(id, category);
    id;
  };

  public query ({ caller }) func getFeeCategory(id : FeeCategoryId) : async FeeCategory {
    requireAuth(caller);
    switch (feeCategoryMap.get(id)) {
      case (null) { Runtime.trap("Fee category not found") };
      case (?category) { category };
    };
  };

  public query ({ caller }) func getAllFeeCategories() : async [FeeCategory] {
    requireAuth(caller);
    feeCategoryMap.values().toArray().sort();
  };

  public shared ({ caller }) func assignFee(studentId : StudentId, feeCategoryId : FeeCategoryId, academicYear : Text) : async Nat {
    requireAuth(caller);
    let assignmentId = nextAssignmentId;
    nextAssignmentId += 1;
    feeAssignments.add(assignmentId, { studentId; feeCategoryId; academicYear });
    assignmentId;
  };

  public query ({ caller }) func getFeeAssignmentsByStudent(studentId : StudentId) : async [FeeAssignment] {
    requireAuth(caller);
    feeAssignments.values().toArray().filter(func(a) { a.studentId == studentId });
  };

  public shared ({ caller }) func recordPayment(payment : Payment) : async PaymentId {
    requireAuth(caller);
    let id = nextPaymentId;
    nextPaymentId += 1;
    paymentMap.add(id, { payment with date = Time.now() });
    id;
  };

  public query ({ caller }) func getPaymentsByStudent(studentId : StudentId) : async [Payment] {
    requireAuth(caller);
    paymentMap.values().toArray().filter(func(p) { p.studentId == studentId });
  };
};
