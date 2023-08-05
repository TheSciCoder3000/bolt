const { Pool, QueryResult, PoolClient } = require("pg");

const pool = new Pool();

/**
 * @typedef {{
 *  id: string,
 *  name: string,
 *  createdat: string,
 *  details: string | null,
 *  subject_id: string | null,
 *  user_id: string,
 *  parent_id: string | null,
 *  tags: string[] | null
 *  duedate: string,
 *  completed: boolean,
 *  duetime: string | null,
 *  task_order: number
 * }} Task
 */

module.exports = {
  /**
   * 
   * @param {string} text 
   * @param {Array} params 
   * @returns {Promise<QueryResult>}
   */
  query: (text, params) => pool.query(text, params),

  /**
   * postgres function to return a client instance
   * @returns {Promise<PoolClient>}
   */
  getClient: async () => {
      const client = await pool.connect()
      const query = client.query
      const release = client.release
      // set a timeout of 5 seconds, after which we will log this client's last query
      const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!')
        console.error(`The last executed query on this client was: ${client.lastQuery}`)
      }, 5000)
      // monkey patch the query method to keep track of the last query executed
      client.query = (...args) => {
        client.lastQuery = args
        return query.apply(client, args)
      }
      client.release = () => {
        // clear our timeout
        clearTimeout(timeout)
        // set the methods back to their old un-monkey-patched version
        client.query = query
        client.release = release
        return release.apply(client)
      }
      return client
  }
}