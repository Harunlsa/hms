import { Table } from "antd";
import { faker, fakerEN_NG } from "@faker-js/faker";
// faker.loc = "en_NG";
import { Patient } from "../types/patient.types";
// import ColumnGroup from "antd/es/table/ColumnGroup";
// import Column from "antd/es/table/Column";

const { Column } = Table;
// Localised name pools
const maleNames = [
  "Abubakar",
  "Aminu",
  "Usman",
  "Ibrahim",
  "Bello",
  "Haruna",
  "Salihu",
  "Adamu",
  "Ali",
  "Amir",
  "Balarabe",
  "Bashir",
  "Bilal",
  "Danlami",
  "Danladi",
  "Faruq",
  "Faisal",
  "Fuad",
  "Gambo",
  "Musa",
  "Sani",
  "Yusuf",
  "Abdullahi",
  "Amadu",
  "Suleiman",
  "Aliyu",
  "Umar",
  "Muhammad",
  "Audu",
  "Lawan",
  "Garba",
];
const femaleNames = [
  "Aisha",
  "Fatima",
  "Zainab",
  "Maryam",
  "Halima",
  "Khadija",
  "Rabi",
  "Asma'u",
  "Aminatu",
  "Asabe",
  "Hadiza",
  "Hauwa",
  "Jamila",
  "Safiya",
  "Bilƙisu",
  "Hafsatu",
  "Asmau",
  "Zulaiha",
  "Aliyah",
  "Yalwa",
  "Sa'adatu",
];
const lastNames = [
  "Abdullahi",
  "Suleiman",
  "Aliyu",
  "Umar",
  "Muhammad",
  "Ibrahim",
  "Audu",
  "Lawal",
  "Garba",
  "Danlami",
  ...maleNames,
];
const HAS_MIDDLE_NAME_PROBABILITY = 0.4;

function localFirstName(gender: "male" | "female") {
  return faker.helpers.arrayElement(
    gender === "male" ? maleNames : femaleNames,
  );
}

function localLastName() {
  return faker.helpers.arrayElement(lastNames);
}

const data: Patient[] = [...createRandomUsers(6)];

function createRandomUser() {
  // const gender = faker.person.sexType();
  const gender = faker.datatype.boolean({
    probability: 0.2,
  })
    ? "male"
    : "female";
  const firstName = localFirstName(gender);
  const middleName = faker.datatype.boolean({
    probability: HAS_MIDDLE_NAME_PROBABILITY,
  })
    ? localFirstName("male")
    : null;
  const lastName = localLastName();
  const name = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const email = fakerEN_NG.internet.email({ firstName, lastName });
  const rawDateOfBirth = faker.date.birthdate();
  const date = new Date(rawDateOfBirth);
  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dateOfBirth = dateOnly.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const address = fakerEN_NG.location.streetAddress();
  return {
    // id: fakerEN_NG.string.uuid(),
    fileNumber: faker.number.int({ min: 100000, max: 999999 }).toString(),
    name,
    dateOfBirth,
    gender,
    phone: fakerEN_NG.phone.number({ style: "national" }),
    email,
    address,
    createdAt: faker.date.recent().toString(),
  };
}

function createRandomUsers(num: number): Patient[] {
  const patients: Patient[] = [];

  for (let i = 1; i < num + 1; i++) {
    // const newPatient = {};
    const specificInfo = createRandomUser();
    const newPatient = {
      id: i.toString(),
      ...specificInfo,
    };
    console.log(`New patient: ${newPatient}`);
    patients.push(newPatient);
  }
  return patients;
}

// const columns: TableProps<Patient>["columns"] = [
//   {
//     title: "S/N",
//     dataIndex: "id",
//     key: "id",
//   },
//   {
//     title: "File #",
//     dataIndex: "fileNumber",
//     key: "fileNumber",
//   },
//   {
//     title: "First Name",
//     dataIndex: "firstName",
//     key: "firstName",
//   },
//   {
//     title: "Last Name",
//     dataIndex: "lastName",
//     key: "lastName",
//   },
//   {
//     title: "Gender",
//     dataIndex: "gender",
//     key: "gender",
//     // render: (text) => ({ text }),
//   },

//   {
//     title: "Phone Number",
//     dataIndex: "phoneNumber",
//     key: "phoneNumber",
//   },
//   {
//     title: "Address",
//     dataIndex: "address",
//     key: "address",
//   },
//   {
//     title: "DOB",
//     dataIndex: "dateOfBirth",
//     key: "dateOfBirth",
//   },
// ];

export default function PatientListPage() {
  return (
    <div>
      <Table<Patient> dataSource={data} bordered>
        <Column title="S/N" dataIndex="id" key="id" />
        <Column title="File Number" dataIndex="fileNumber" key="fileNumber" />
        <Column title="Name" dataIndex="name" key="name" />
        <Column
          title="Gender"
          dataIndex="gender"
          key="gender"
          render={(text) => text[0].toUpperCase() + text.slice(1, text.length)}
        />
        <Column title="DOB" dataIndex="dateOfBirth" key="dateOfBirth" />
        <Column title="Phone Number" dataIndex="phone" key="phone" />
        <Column title="Email" dataIndex="email" key="email" />
        <Column title="Address" dataIndex="address" key="address" />
      </Table>
    </div>
  );
}
