export interface DatabaseTable {
  name: string;
  displayName: string;
  description?: string;
  columns: Array<{
    name: string;
    type: 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'NUMERIC';
    nullable?: boolean;
    primaryKey?: boolean;
    unique?: boolean;
    defaultValue?: string | number;
  }>;
  data: Record<string, any>[];
  indexes?: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
}

export interface PracticeExercise {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tables: DatabaseTable[];
  questions: Array<{
    id: string;
    text: string;
    hint?: string;
    solution?: string;
    expectedColumns?: string[];
    expectedRowCount?: number;
    explanation?: string;
  }>;
}

export const SAMPLE_EXERCISES: PracticeExercise[] = [
  {
    id: 'sql-basics-1',
    title: 'Introduction - SQL exercise',
    description: 'Work through the challenge and submit your solution when you are ready.',
    category: 'SQL Basics',
    difficulty: 'Beginner',
    tables: [
      {
        name: 'sales_data',
        displayName: 'SALES DATA (SALES)',
        description: 'Product sales information',
        columns: [
          { name: 'product_id', type: 'INTEGER', primaryKey: true },
          { name: 'product_name', type: 'TEXT', nullable: false },
          { name: 'category', type: 'TEXT' },
          { name: 'price', type: 'REAL' },
          { name: 'quantity_sold', type: 'INTEGER' }
        ],
        data: [
          { product_id: 1, product_name: 'Laptop', category: 'Electronics', price: 999.99, quantity_sold: 50 },
          { product_id: 2, product_name: 'Mouse', category: 'Electronics', price: 29.99, quantity_sold: 150 },
          { product_id: 3, product_name: 'Book', category: 'Education', price: 19.99, quantity_sold: 75 },
          { product_id: 4, product_name: 'Desk Chair', category: 'Furniture', price: 199.99, quantity_sold: 30 },
          { product_id: 5, product_name: 'Monitor', category: 'Electronics', price: 299.99, quantity_sold: 40 }
        ]
      },
      {
        name: 'employees',
        displayName: 'EMPLOYEE DATA (EMPLOYEES)',
        description: 'Employee information and hierarchy',
        columns: [
          { name: 'employee_id', type: 'INTEGER', primaryKey: true },
          { name: 'first_name', type: 'TEXT', nullable: false },
          { name: 'last_name', type: 'TEXT', nullable: false },
          { name: 'department', type: 'TEXT' },
          { name: 'position', type: 'TEXT' },
          { name: 'salary', type: 'REAL' },
          { name: 'hire_date', type: 'TEXT' },
          { name: 'manager_id', type: 'INTEGER' }
        ],
        data: [
          { employee_id: 1, first_name: 'John', last_name: 'Doe', department: 'Sales', position: 'Manager', salary: 75000, hire_date: '2020-01-15', manager_id: null },
          { employee_id: 2, first_name: 'Jane', last_name: 'Smith', department: 'Sales', position: 'Representative', salary: 50000, hire_date: '2021-03-10', manager_id: 1 },
          { employee_id: 3, first_name: 'Bob', last_name: 'Johnson', department: 'IT', position: 'Developer', salary: 80000, hire_date: '2019-06-20', manager_id: 4 },
          { employee_id: 4, first_name: 'Alice', last_name: 'Brown', department: 'IT', position: 'Manager', salary: 90000, hire_date: '2018-09-05', manager_id: null },
          { employee_id: 5, first_name: 'Charlie', last_name: 'Wilson', department: 'Marketing', position: 'Specialist', salary: 55000, hire_date: '2022-01-12', manager_id: null }
        ]
      },
      {
        name: 'orders',
        displayName: 'ORDER DATA (ORDERS)',
        description: 'Customer order information',
        columns: [
          { name: 'order_id', type: 'INTEGER', primaryKey: true },
          { name: 'customer_id', type: 'INTEGER' },
          { name: 'product_id', type: 'INTEGER' },
          { name: 'quantity', type: 'INTEGER' },
          { name: 'order_date', type: 'TEXT' },
          { name: 'total_amount', type: 'REAL' }
        ],
        data: [
          { order_id: 1, customer_id: 101, product_id: 1, quantity: 1, order_date: '2024-01-15', total_amount: 999.99 },
          { order_id: 2, customer_id: 102, product_id: 2, quantity: 2, order_date: '2024-01-16', total_amount: 59.98 },
          { order_id: 3, customer_id: 103, product_id: 3, quantity: 3, order_date: '2024-01-17', total_amount: 59.97 },
          { order_id: 4, customer_id: 101, product_id: 5, quantity: 1, order_date: '2024-01-18', total_amount: 299.99 },
          { order_id: 5, customer_id: 104, product_id: 4, quantity: 1, order_date: '2024-01-19', total_amount: 199.99 }
        ]
      }
    ],
    questions: [
      {
        id: 'q1',
        text: 'Select all products from the sales_data table.',
        hint: 'Use SELECT * FROM table_name to get all columns and rows.',
        solution: 'SELECT * FROM sales_data;',
        expectedColumns: ['product_id', 'product_name', 'category', 'price', 'quantity_sold'],
        expectedRowCount: 5,
        explanation: 'The asterisk (*) selects all columns from the table.'
      },
      {
        id: 'q2',
        text: 'Find all employees in the Sales department.',
        hint: 'Use WHERE clause to filter by department.',
        solution: 'SELECT * FROM employees WHERE department = \'Sales\';',
        expectedColumns: ['employee_id', 'first_name', 'last_name', 'department', 'position', 'salary', 'hire_date', 'manager_id'],
        expectedRowCount: 2,
        explanation: 'WHERE clause filters rows based on the specified condition.'
      },
      {
        id: 'q3',
        text: 'Calculate the total revenue for each product category.',
        hint: 'Use GROUP BY with SUM() and multiply price by quantity_sold.',
        solution: 'SELECT category, SUM(price * quantity_sold) as total_revenue FROM sales_data GROUP BY category;',
        expectedColumns: ['category', 'total_revenue'],
        expectedRowCount: 3,
        explanation: 'GROUP BY groups rows by category, and SUM() calculates the total for each group.'
      }
    ]
  },
  {
    id: 'sql-joins-1',
    title: 'SQL Joins and Relationships',
    description: 'Learn to combine data from multiple tables using joins.',
    category: 'SQL Intermediate',
    difficulty: 'Intermediate',
    tables: [
      {
        name: 'customers',
        displayName: 'CUSTOMERS',
        description: 'Customer information',
        columns: [
          { name: 'customer_id', type: 'INTEGER', primaryKey: true },
          { name: 'name', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', unique: true },
          { name: 'city', type: 'TEXT' },
          { name: 'registration_date', type: 'TEXT' }
        ],
        data: [
          { customer_id: 101, name: 'Michael Johnson', email: 'michael.j@email.com', city: 'New York', registration_date: '2023-01-15' },
          { customer_id: 102, name: 'Sarah Davis', email: 'sarah.d@email.com', city: 'Los Angeles', registration_date: '2023-02-20' },
          { customer_id: 103, name: 'David Wilson', email: 'david.w@email.com', city: 'Chicago', registration_date: '2023-03-10' },
          { customer_id: 104, name: 'Emma Brown', email: 'emma.b@email.com', city: 'Houston', registration_date: '2023-04-05' }
        ]
      },
      {
        name: 'products',
        displayName: 'PRODUCTS',
        description: 'Product catalog',
        columns: [
          { name: 'product_id', type: 'INTEGER', primaryKey: true },
          { name: 'name', type: 'TEXT', nullable: false },
          { name: 'category_id', type: 'INTEGER' },
          { name: 'price', type: 'REAL' },
          { name: 'stock_quantity', type: 'INTEGER' }
        ],
        data: [
          { product_id: 1, name: 'Gaming Laptop', category_id: 1, price: 1299.99, stock_quantity: 25 },
          { product_id: 2, name: 'Wireless Mouse', category_id: 1, price: 49.99, stock_quantity: 100 },
          { product_id: 3, name: 'Office Chair', category_id: 2, price: 299.99, stock_quantity: 15 },
          { product_id: 4, name: 'Programming Book', category_id: 3, price: 39.99, stock_quantity: 50 },
          { product_id: 5, name: '4K Monitor', category_id: 1, price: 449.99, stock_quantity: 20 }
        ]
      },
      {
        name: 'categories',
        displayName: 'CATEGORIES',
        description: 'Product categories',
        columns: [
          { name: 'category_id', type: 'INTEGER', primaryKey: true },
          { name: 'name', type: 'TEXT', nullable: false },
          { name: 'description', type: 'TEXT' }
        ],
        data: [
          { category_id: 1, name: 'Electronics', description: 'Electronic devices and accessories' },
          { category_id: 2, name: 'Furniture', description: 'Office and home furniture' },
          { category_id: 3, name: 'Books', description: 'Educational and technical books' }
        ]
      }
    ],
    questions: [
      {
        id: 'j1',
        text: 'List all products with their category names.',
        hint: 'Join products and categories tables on category_id.',
        solution: 'SELECT p.name AS product_name, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.category_id;',
        expectedColumns: ['product_name', 'category_name'],
        expectedRowCount: 5,
        explanation: 'INNER JOIN combines rows from both tables where the join condition is met.'
      },
      {
        id: 'j2',
        text: 'Find customers who have never placed an order.',
        hint: 'Use LEFT JOIN with orders table and check for NULL values.',
        solution: 'SELECT c.* FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id WHERE o.customer_id IS NULL;',
        expectedColumns: ['customer_id', 'name', 'email', 'city', 'registration_date'],
        explanation: 'LEFT JOIN includes all customers, and IS NULL finds those without orders.'
      }
    ]
  }
];

export function generateDatabaseSchema(tables: DatabaseTable[]): string {
  let schema = '';
  
  for (const table of tables) {
    schema += `-- Table: ${table.displayName}\n`;
    if (table.description) {
      schema += `-- ${table.description}\n`;
    }
    
    schema += `CREATE TABLE ${table.name} (\n`;
    
    const columnDefs = table.columns.map(col => {
      let def = `  ${col.name} ${col.type}`;
      
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (!col.nullable && !col.primaryKey) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.defaultValue !== undefined) {
        def += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`;
      }
      
      return def;
    });
    
    schema += columnDefs.join(',\n') + '\n';
    schema += ');\n\n';
    
    // Add indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        const uniqueKeyword = index.unique ? 'UNIQUE ' : '';
        schema += `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${table.name} (${index.columns.join(', ')});\n`;
      }
      schema += '\n';
    }
    
    // Add sample data
    if (table.data.length > 0) {
      schema += `-- Sample data for ${table.name}\n`;
      const columns = Object.keys(table.data[0]);
      
      for (const row of table.data) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          return typeof value === 'string' ? `'${value}'` : value;
        }).join(', ');
        
        schema += `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values});\n`;
      }
      schema += '\n';
    }
  }
  
  return schema;
}

export function getExerciseById(id: string): PracticeExercise | null {
  return SAMPLE_EXERCISES.find(ex => ex.id === id) || null;
}

export function getAllExercises(): PracticeExercise[] {
  return SAMPLE_EXERCISES;
}

export function getExercisesByDifficulty(difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): PracticeExercise[] {
  return SAMPLE_EXERCISES.filter(ex => ex.difficulty === difficulty);
}

export function getExercisesByCategory(category: string): PracticeExercise[] {
  return SAMPLE_EXERCISES.filter(ex => ex.category === category);
}