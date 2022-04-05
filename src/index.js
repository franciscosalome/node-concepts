const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(usr => usr.username === username)
  if(!user){
    return response.status(400).json({error: 'User not found!'})
  }
  request.user = user;
  return next()
}

function findTodoIndexById(id, todos){
  let todoIndex = -1
  todos.forEach((todo, index) => {
    if(todo.id === id){
      todoIndex = index
    }
  })
  return todoIndex
}

app.post('/users', (request, response) => {
  const {username, name} = request.body;
  const existsUser = users.some(usr => usr.username === username)
  if(existsUser){
    return response.status(400).json({error: 'Username already registered!'})
  }
  const id = uuidv4()
  const user = {
    id,
    name,
    username,
    todos: []
  }
  users.push(user)
  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  
  const { user } = request;
  const { todos } = user;

  return response.json(todos)

});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const formatedDeadline = new Date(deadline);
  if(!formatedDeadline){
    return response.status(400).json({error: 'The deadline date is invalid!'})
  }
  const todoId = uuidv4();
  const newTodo = {
    id: todoId,
    done: false,
    title,
    deadline: formatedDeadline,
    created_at: new Date()
  }
  user.todos.push(newTodo);
  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {user} = request;
  const { title, deadline } = request.body;
  const {id} = request.params;

  const todoIndex = findTodoIndexById(id, user.todos)

  if(todoIndex < 0){
    return response.status(404).json({error: 'ToDo not found!'})
  }
  user.todos[todoIndex] = {
    ...user.todos[todoIndex],
    title,
    deadline: new Date(deadline)
  }
  
  return response.status(201).json({...user.todos[todoIndex]})

});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request
  const todoIndex = findTodoIndexById(id, user.todos)
  if(todoIndex < 0){
    return response.status(404).json({error: 'Todo not found'})
  }

  user.todos[todoIndex].done = true
  return response.status(201).json(user.todos[todoIndex])
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request
  const todoIndex = findTodoIndexById(id, user.todos)
  if(todoIndex < 0){
    return response.status(404).json({error: 'Todo id not found!'})
  }
  user.todos = user.todos.filter((todo) => todo.id === todoIndex)
  return response.status(204).send()
});

module.exports = app;