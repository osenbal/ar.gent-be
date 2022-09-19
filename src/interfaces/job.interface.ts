export default interface Job {
  _id: string;
  userId: string;
  emailUser: string;
  image: string;
  title: string;
  description: string;
  category: string[];
  salary: string;
  created_at: string;
  deleted_at: string | null;
}
