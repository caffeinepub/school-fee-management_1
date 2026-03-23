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
  // Types and Modules

  type StudentId = Nat;
  type FeeCategoryId = Nat;
  type PaymentId = Nat;

  public type Frequency = {
    #annual;
    #termly;
    #monthly;
  };

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

  public type UserProfile = {
    name : Text;
  };

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

  // Persistent State

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

  // User Profile Management

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Student Management

  public shared ({ caller }) func registerStudent(student : Student) : async StudentId {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can register students");
    };
    let id = nextStudentId;
    nextStudentId += 1;
    studentMap.add(id, { student with enrollmentDate = Time.now() });
    id;
  };

  public query ({ caller }) func getStudent(id : StudentId) : async Student {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view student data");
    };
    switch (studentMap.get(id)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student };
    };
  };

  public query ({ caller }) func getAllStudents() : async [Student] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view student data");
    };
    studentMap.values().toArray().sort();
  };

  // Fee Category Management

  public shared ({ caller }) func createFeeCategory(category : FeeCategory) : async FeeCategoryId {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create fee categories");
    };
    let id = nextFeeCategoryId;
    nextFeeCategoryId += 1;
    feeCategoryMap.add(id, category);
    id;
  };

  public query ({ caller }) func getFeeCategory(id : FeeCategoryId) : async FeeCategory {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fee categories");
    };
    switch (feeCategoryMap.get(id)) {
      case (null) { Runtime.trap("Fee category not found") };
      case (?category) { category };
    };
  };

  public query ({ caller }) func getAllFeeCategories() : async [FeeCategory] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fee categories");
    };
    feeCategoryMap.values().toArray().sort();
  };

  // Fee Assignment

  public shared ({ caller }) func assignFee(studentId : StudentId, feeCategoryId : FeeCategoryId, academicYear : Text) : async Nat {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign fees");
    };
    let assignmentId = nextAssignmentId;
    nextAssignmentId += 1;
    feeAssignments.add(
      assignmentId,
      {
        studentId;
        feeCategoryId;
        academicYear;
      },
    );
    assignmentId;
  };

  public query ({ caller }) func getFeeAssignmentsByStudent(studentId : StudentId) : async [FeeAssignment] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fee assignments");
    };
    feeAssignments.values().toArray().filter(func(a) { a.studentId == studentId });
  };

  // Payments

  public shared ({ caller }) func recordPayment(payment : Payment) : async PaymentId {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can record payments");
    };
    let id = nextPaymentId;
    nextPaymentId += 1;
    paymentMap.add(id, { payment with date = Time.now() });
    id;
  };

  public query ({ caller }) func getPaymentsByStudent(studentId : StudentId) : async [Payment] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    paymentMap.values().toArray().filter(func(p) { p.studentId == studentId });
  };
};
