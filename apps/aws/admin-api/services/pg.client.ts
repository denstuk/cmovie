import { Client, ClientConfig } from "pg";

/**
 * Simple PostgreSQL client for Lambda functions.
 * This implementation focuses solely on query operations, creating a new connection for each query.
 * Suitable for lightweight Lambda functions with infrequent database access.
 */
export class PgClient {
	private static getClientConfig(): ClientConfig {
		return {
			host: process.env.POSTGRES_HOST,
			port: parseInt(process.env.POSTGRES_PORT || "5432"),
			database: process.env.POSTGRES_NAME,
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASS,
			connectionTimeoutMillis: 1000,
			ssl: true,
		};
	}

	/**
	 * Execute a query
	 * Creates a new connection for each query and automatically closes it after completion
	 */
	public static async query<T = any>(
		text: string,
		params: any[] = [],
	): Promise<T[]> {
		const client = new Client(this.getClientConfig());
		const start = Date.now();

		try {
			await client.connect();
			const result = await client.query(text, params);
			const duration = Date.now() - start;

			console.log({
				query: text,
				params,
				duration,
				rows: result.rowCount,
			});

			return result.rows as T[];
		} catch (error) {
			console.error("Error executing query", { text, params, error });
			throw error;
		} finally {
			await client.end();
		}
	}
}
