// Sample SQL datasets for practice exercises

export interface SQLDataset {
  id: string;
  name: string;
  description: string;
  table_name: string;
  columns: string[];
  data: any[];
  schema?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
}

export const SAMPLE_SQL_DATASETS: SQLDataset[] = [
  {
    id: 'sales_dataset',
    name: 'Sales Data',
    description: 'Sales transactions and customer information for a retail company',
    table_name: 'sales_data',
    columns: ['product_id', 'product_name', 'category', 'price', 'units_sold', 'total_revenue', 'customer_region', 'sale_date'],
    difficulty: 'beginner',
    tags: ['sales', 'revenue', 'products'],
    data: [
      { product_id: 1, product_name: 'Laptop', category: 'Electronics', price: 999.99, units_sold: 15, total_revenue: 14999.85, customer_region: 'North', sale_date: '2024-01-15' },
      { product_id: 2, product_name: 'Mouse', category: 'Electronics', price: 25.99, units_sold: 45, total_revenue: 1169.55, customer_region: 'South', sale_date: '2024-01-16' },
      { product_id: 3, product_name: 'Book', category: 'Education', price: 19.99, units_sold: 62, total_revenue: 1239.38, customer_region: 'East', sale_date: '2024-01-17' },
      { product_id: 4, product_name: 'Chair', category: 'Furniture', price: 149.99, units_sold: 8, total_revenue: 1199.92, customer_region: 'West', sale_date: '2024-01-18' },
      { product_id: 5, product_name: 'Pen', category: 'Office', price: 2.99, units_sold: 120, total_revenue: 358.80, customer_region: 'North', sale_date: '2024-01-19' },
      { product_id: 1, product_name: 'Laptop', category: 'Electronics', price: 999.99, units_sold: 12, total_revenue: 11999.88, customer_region: 'East', sale_date: '2024-01-20' },
      { product_id: 6, product_name: 'Tablet', category: 'Electronics', price: 399.99, units_sold: 20, total_revenue: 7999.80, customer_region: 'South', sale_date: '2024-01-21' },
      { product_id: 7, product_name: 'Notebook', category: 'Education', price: 4.99, units_sold: 85, total_revenue: 424.15, customer_region: 'West', sale_date: '2024-01-22' },
      { product_id: 8, product_name: 'Monitor', category: 'Electronics', price: 299.99, units_sold: 18, total_revenue: 5399.82, customer_region: 'North', sale_date: '2024-01-23' },
      { product_id: 9, product_name: 'Keyboard', category: 'Office', price: 79.99, units_sold: 32, total_revenue: 2559.68, customer_region: 'East', sale_date: '2024-01-24' },
    ]
  },
  {
    id: 'employees_dataset',
    name: 'Employee Data',
    description: 'Employee information including salaries, departments, and performance metrics',
    table_name: 'employees',
    columns: ['employee_id', 'first_name', 'last_name', 'department', 'salary', 'hire_date', 'manager_id', 'performance_rating'],
    difficulty: 'intermediate',
    tags: ['hr', 'employees', 'management'],
    data: [
      { employee_id: 1, first_name: 'John', last_name: 'Doe', department: 'Engineering', salary: 85000, hire_date: '2022-03-15', manager_id: null, performance_rating: 4.5 },
      { employee_id: 2, first_name: 'Jane', last_name: 'Smith', department: 'Engineering', salary: 78000, hire_date: '2022-05-20', manager_id: 1, performance_rating: 4.2 },
      { employee_id: 3, first_name: 'Bob', last_name: 'Johnson', department: 'Sales', salary: 65000, hire_date: '2021-11-10', manager_id: null, performance_rating: 4.8 },
      { employee_id: 4, first_name: 'Alice', last_name: 'Brown', department: 'Sales', salary: 58000, hire_date: '2022-01-08', manager_id: 3, performance_rating: 4.0 },
      { employee_id: 5, first_name: 'Charlie', last_name: 'Wilson', department: 'Marketing', salary: 55000, hire_date: '2022-07-12', manager_id: null, performance_rating: 4.6 },
      { employee_id: 6, first_name: 'Diana', last_name: 'Taylor', department: 'Engineering', salary: 72000, hire_date: '2023-01-15', manager_id: 1, performance_rating: 3.8 },
      { employee_id: 7, first_name: 'Edward', last_name: 'Anderson', department: 'Sales', salary: 62000, hire_date: '2022-09-05', manager_id: 3, performance_rating: 4.3 },
      { employee_id: 8, first_name: 'Fiona', last_name: 'Thomas', department: 'Marketing', salary: 52000, hire_date: '2022-12-01', manager_id: 5, performance_rating: 4.1 },
    ]
  },
  {
    id: 'orders_dataset',
    name: 'Order Processing',
    description: 'Customer orders, products, and shipping information for an e-commerce company',
    table_name: 'orders',
    columns: ['order_id', 'customer_id', 'order_date', 'product_id', 'quantity', 'unit_price', 'total_amount', 'status', 'ship_date'],
    difficulty: 'intermediate',
    tags: ['ecommerce', 'orders', 'customers'],
    data: [
      { order_id: 1001, customer_id: 201, order_date: '2024-01-10', product_id: 1, quantity: 2, unit_price: 999.99, total_amount: 1999.98, status: 'shipped', ship_date: '2024-01-12' },
      { order_id: 1002, customer_id: 202, order_date: '2024-01-11', product_id: 6, quantity: 1, unit_price: 399.99, total_amount: 399.99, status: 'shipped', ship_date: '2024-01-13' },
      { order_id: 1003, customer_id: 203, order_date: '2024-01-12', product_id: 2, quantity: 3, unit_price: 25.99, total_amount: 77.97, status: 'processing', ship_date: null },
      { order_id: 1004, customer_id: 204, order_date: '2024-01-13', product_id: 9, quantity: 2, unit_price: 79.99, total_amount: 159.98, status: 'shipped', ship_date: '2024-01-15' },
      { order_id: 1005, customer_id: 201, order_date: '2024-01-14', product_id: 5, quantity: 5, unit_price: 2.99, total_amount: 14.95, status: 'delivered', ship_date: '2024-01-16' },
      { order_id: 1006, customer_id: 205, order_date: '2024-01-15', product_id: 8, quantity: 1, unit_price: 299.99, total_amount: 299.99, status: 'shipped', ship_date: '2024-01-17' },
      { order_id: 1007, customer_id: 202, order_date: '2024-01-16', product_id: 3, quantity: 4, unit_price: 19.99, total_amount: 79.96, status: 'processing', ship_date: null },
      { order_id: 1008, customer_id: 206, order_date: '2024-01-17', product_id: 7, quantity: 6, unit_price: 4.99, total_amount: 29.94, status: 'cancelled', ship_date: null },
    ]
  },
  {
    id: 'movies_dataset',
    name: 'Movie Database',
    description: 'Movies, directors, actors, and ratings information',
    table_name: 'movies',
    columns: ['movie_id', 'title', 'release_year', 'genre', 'director', 'rating', 'budget', 'box_office', 'runtime_minutes'],
    difficulty: 'intermediate',
    tags: ['entertainment', 'movies', 'ratings'],
    data: [
      { movie_id: 1, title: 'The Shawshank Redemption', release_year: 1994, genre: 'Drama', director: 'Frank Darabont', rating: 9.3, budget: 25000000, box_office: 28800000, runtime_minutes: 142 },
      { movie_id: 2, title: 'The Godfather', release_year: 1972, genre: 'Crime', director: 'Francis Ford Coppola', rating: 9.2, budget: 6000000, box_office: 246120986, runtime_minutes: 175 },
      { movie_id: 3, title: 'The Dark Knight', release_year: 2008, genre: 'Action', director: 'Christopher Nolan', rating: 9.0, budget: 185000000, box_office: 1004558444, runtime_minutes: 152 },
      { movie_id: 4, title: 'Pulp Fiction', release_year: 1994, genre: 'Crime', director: 'Quentin Tarantino', rating: 8.9, budget: 8000000, box_office: 214179088, runtime_minutes: 154 },
      { movie_id: 5, title: 'Forrest Gump', release_year: 1994, genre: 'Drama', director: 'Robert Zemeckis', rating: 8.8, budget: 55000000, box_office: 677387716, runtime_minutes: 142 },
      { movie_id: 6, title: 'Inception', release_year: 2010, genre: 'Sci-Fi', director: 'Christopher Nolan', rating: 8.8, budget: 160000000, box_office: 836836967, runtime_minutes: 148 },
      { movie_id: 7, title: 'The Matrix', release_year: 1999, genre: 'Sci-Fi', director: 'Lana Wachowski', rating: 8.7, budget: 63000000, box_office: 467222824, runtime_minutes: 136 },
      { movie_id: 8, title: 'Goodfellas', release_year: 1990, genre: 'Crime', director: 'Martin Scorsese', rating: 8.7, budget: 25000000, box_office: 46836394, runtime_minutes: 146 },
    ]
  },
  {
    id: 'students_dataset',
    name: 'Student Grades',
    description: 'Student information, courses, and grades for a university',
    table_name: 'student_grades',
    columns: ['student_id', 'student_name', 'course_code', 'course_name', 'semester', 'grade', 'credits', 'instructor', 'enrollment_date'],
    difficulty: 'intermediate',
    tags: ['education', 'grades', 'courses'],
    data: [
      { student_id: 1001, student_name: 'Alice Johnson', course_code: 'CS101', course_name: 'Introduction to Programming', semester: 'Fall 2023', grade: 'A', credits: 3, instructor: 'Dr. Smith', enrollment_date: '2023-08-25' },
      { student_id: 1001, student_name: 'Alice Johnson', course_code: 'MATH201', course_name: 'Calculus I', semester: 'Fall 2023', grade: 'B+', credits: 4, instructor: 'Dr. Brown', enrollment_date: '2023-08-25' },
      { student_id: 1002, student_name: 'Bob Wilson', course_code: 'CS101', course_name: 'Introduction to Programming', semester: 'Fall 2023', grade: 'B', credits: 3, instructor: 'Dr. Smith', enrollment_date: '2023-08-25' },
      { student_id: 1002, student_name: 'Bob Wilson', course_code: 'ENG102', course_name: 'English Composition', semester: 'Fall 2023', grade: 'A-', credits: 3, instructor: 'Dr. Davis', enrollment_date: '2023-08-25' },
      { student_id: 1003, student_name: 'Charlie Brown', course_code: 'MATH201', course_name: 'Calculus I', semester: 'Fall 2023', grade: 'C+', credits: 4, instructor: 'Dr. Brown', enrollment_date: '2023-08-25' },
      { student_id: 1003, student_name: 'Charlie Brown', course_code: 'PHYS101', course_name: 'Physics I', semester: 'Fall 2023', grade: 'B-', credits: 4, instructor: 'Dr. Johnson', enrollment_date: '2023-08-26' },
      { student_id: 1001, student_name: 'Alice Johnson', course_code: 'CS201', course_name: 'Data Structures', semester: 'Spring 2024', grade: 'A-', credits: 3, instructor: 'Dr. Miller', enrollment_date: '2024-01-15' },
      { student_id: 1002, student_name: 'Bob Wilson', course_code: 'MATH201', course_name: 'Calculus I', semester: 'Spring 2024', grade: 'B', credits: 4, instructor: 'Dr. Brown', enrollment_date: '2024-01-15' },
      { student_id: 1004, student_name: 'Diana Prince', course_code: 'CS101', course_name: 'Introduction to Programming', semester: 'Spring 2024', grade: 'A', credits: 3, instructor: 'Dr. Smith', enrollment_date: '2024-01-16' },
    ]
  },
  {
    id: 'ecommerce_advanced',
    name: 'E-commerce Analytics',
    description: 'Advanced e-commerce data with customers, products, orders, and reviews',
    table_name: 'ecommerce_customers',
    columns: ['customer_id', 'name', 'email', 'registration_date', 'total_orders', 'total_spent', 'loyalty_tier'],
    difficulty: 'advanced',
    tags: ['ecommerce', 'analytics', 'customers', 'advanced'],
    data: [
      { customer_id: 1, name: 'John Doe', email: 'john.doe@email.com', registration_date: '2023-01-15', total_orders: 12, total_spent: 2847.50, loyalty_tier: 'Gold' },
      { customer_id: 2, name: 'Jane Smith', email: 'jane.smith@email.com', registration_date: '2023-02-20', total_orders: 8, total_spent: 1569.99, loyalty_tier: 'Silver' },
      { customer_id: 3, name: 'Bob Johnson', email: 'bob.johnson@email.com', registration_date: '2023-03-10', total_orders: 25, total_spent: 5234.75, loyalty_tier: 'Platinum' },
      { customer_id: 4, name: 'Alice Brown', email: 'alice.brown@email.com', registration_date: '2023-01-05', total_orders: 6, total_spent: 894.50, loyalty_tier: 'Silver' },
      { customer_id: 5, name: 'Charlie Wilson', email: 'charlie.wilson@email.com', registration_date: '2023-04-12', total_orders: 3, total_spent: 456.25, loyalty_tier: 'Bronze' },
      { customer_id: 6, name: 'Diana Davis', email: 'diana.davis@email.com', registration_date: '2023-05-08', total_orders: 18, total_spent: 3899.99, loyalty_tier: 'Gold' },
    ],
    schema: `
-- Advanced E-commerce Schema with multiple related tables
CREATE TABLE ecommerce_customers (
  customer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  registration_date TEXT,
  total_orders INTEGER,
  total_spent REAL,
  loyalty_tier TEXT
);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock_quantity INTEGER,
  supplier_id INTEGER
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  order_date TEXT,
  total_amount REAL,
  status TEXT,
  FOREIGN KEY (customer_id) REFERENCES ecommerce_customers(customer_id)
);

CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  unit_price REAL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE reviews (
  review_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  rating INTEGER,
  review_text TEXT,
  review_date TEXT,
  FOREIGN KEY (customer_id) REFERENCES ecommerce_customers(customer_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
`
  }
];

// Helper functions for dataset management
export function getDatasetById(id: string): SQLDataset | undefined {
  return SAMPLE_SQL_DATASETS.find(dataset => dataset.id === id);
}

export function getDatasetsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): SQLDataset[] {
  return SAMPLE_SQL_DATASETS.filter(dataset => dataset.difficulty === difficulty);
}

export function getDatasetsByTags(tags: string[]): SQLDataset[] {
  return SAMPLE_SQL_DATASETS.filter(dataset =>
    tags.some(tag => dataset.tags?.includes(tag))
  );
}

export function searchDatasets(query: string): SQLDataset[] {
  const lowercaseQuery = query.toLowerCase();
  return SAMPLE_SQL_DATASETS.filter(dataset =>
    dataset.name.toLowerCase().includes(lowercaseQuery) ||
    dataset.description.toLowerCase().includes(lowercaseQuery) ||
    dataset.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getRandomDataset(): SQLDataset {
  const randomIndex = Math.floor(Math.random() * SAMPLE_SQL_DATASETS.length);
  return SAMPLE_SQL_DATASETS[randomIndex];
}

export function getDatasetsForExercise(exerciseType: 'basic' | 'aggregation' | 'joins' | 'subqueries' | 'advanced'): SQLDataset[] {
  const mapping = {
    basic: ['sales_dataset'],
    aggregation: ['employees_dataset', 'orders_dataset'],
    joins: ['orders_dataset', 'students_dataset'],
    subqueries: ['movies_dataset', 'students_dataset'],
    advanced: ['ecommerce_advanced']
  };

  const datasetIds = mapping[exerciseType] || ['sales_dataset'];
  return SAMPLE_SQL_DATASETS.filter(dataset => datasetIds.includes(dataset.id));
}
