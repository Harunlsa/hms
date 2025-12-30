import { DownCircleTwoTone } from "@ant-design/icons";
import { Button, Table } from "antd";
import { StarOutlined, StarFilled, StarTwoTone } from "@ant-design/icons";

const data = [
  { key: 1, name: "John", age: 32 },
  { key: 2, name: "Sarah", age: 27 },
];

export default function TestUI() {
  return (
    <>
      <Button type="primary">Test Button</Button>

      <Table
        columns={[
          { title: "Name", dataIndex: "name" },
          { title: "Age", dataIndex: "age" },
        ]}
        dataSource={data}
      />
      <DownCircleTwoTone spin={true} />
      <StarOutlined />
      <StarFilled />
      <StarTwoTone twoToneColor="#eb2f96" />
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <div className="bg-primary text-white p-md rounded-lg">SJFLDJ</div>
      <section className="space-y-lg">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquam
        blanditiis similique sunt voluptas atque est repellat voluptatibus
        assumenda distinctio, cupiditate maiores quidem, dolorum harum quis.
        Adipisci doloribus labore sint odit provident dolorem eveniet quaerat a,
        omnis distinctio saepe amet, sit sapiente hic quas assumenda similique
        ducimus aperiam explicabo voluptates. Alias.
      </section>
      <div className="flex gap-md">
        <Button type="primary">Save</Button>
      </div>
    </>
  );
}
