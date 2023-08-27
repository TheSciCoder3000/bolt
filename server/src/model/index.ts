import { Pool, types } from "pg";
types.setTypeParser(1082, (stringVal) => {
  return stringVal
})
const pool = new Pool();

export interface TaskSchema {
  id: string;
  name: string;
  createdat: string;
  details: string | null;
  subject_id: string | null;
  user_id: string;
  parent_id: string | null;
  tags: string[] | null;
  duedate: string;
  completed: boolean;
  duetime: string | null;
  task_order: number;
}

const model = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
  getClient: async () => {
      const client = await pool.connect()
      const query = client.query
      const release = client.release

      client.release = () => {
        // set the methods back to their old un-monkey-patched version
        client.query = query
        client.release = release
        return release.apply(client)
      }
      return client
  },
  pool: pool
}

export default model;