import { Pool, types } from "pg";
types.setTypeParser(1082, (stringVal) => {
  return stringVal
})
const pool = new Pool();

export default pool;