const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({
      error: `User with username "${username}" not found`
    });
  }

  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const user = users.find((user) => user.username === username);

  if (user) {
    return response.status(400).json({
      error: `User with username "${username}" already exists`
    });
  }

  const newUser = {
    id: uuidv4(),
    todos: [],
    username,
    name,
  };

  users.push(newUser);
  response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.json(request.user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    deadline: new Date(deadline).toISOString(),
    created_at: new Date().toISOString(),
    done: false,
    title,
  };

  user.todos.push(newTodo);
  response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { user } = request;

  const index = user.todos.findIndex((todo) => todo.id === id);
  const todo = user.todos[index];

  if (!todo) {
    return response.status(404).json({
      error: `Todo with id "${id}" not found`
    });
  }

  const updatedTodo = {
    ...todo,
    deadline,
    title,
  };

  user.todos[index] = updatedTodo;
  response.status(200).json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find((todo) => todo.id === id);

  if (!todo) {
    return response.status(404).json({
      error: `Todo with id "${id}" not found`
    });
  }

  todo.done = true;
  response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const index = user.todos.findIndex((todo) => todo.id === id);
  const todo = user.todos[index];

  if (!todo) {
    return response.status(404).json({
      error: `Todo with id "${id}" not found`
    });
  }

  user.todos.splice(index, 1);
  response.status(204).json(todo);
});

module.exports = app;