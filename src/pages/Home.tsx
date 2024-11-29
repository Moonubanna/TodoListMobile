import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { trace, metrics } from '@opentelemetry/api';

import { Header } from "../components/Header";
import { Task, TasksList } from "../components/TasksList";
import { TodoInput } from "../components/TodoInput";

export function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Initialize tracer and meter
  const tracer = trace.getTracer('todo-tracer');
  const meter = metrics.getMeter('todo-metrics');
  const tasksCounter = meter.createCounter('tasks_total', {
    description: 'Total number of tasks added to the Todo list',
  });

  const tasksCompletedCounter = meter.createCounter('tasks_completed', {
    description: 'Total number of tasks marked as completed',
  });

  const tasksRemovedCounter = meter.createCounter('tasks_removed', {
    description: 'Total number of tasks removed',
  });

  function handleAddTask(newTaskTitle: string) {
    const span = tracer.startSpan('Add Task'); // Start a span

    try {
      const hasTaskWithThisName =
        tasks.findIndex((task) => task.title === newTaskTitle) > -1;

      if (hasTaskWithThisName) {
        Alert.alert(
          "Task already exists",
          "You cannot add a task with the same name"
        );
      } else {
        setTasks([
          ...tasks,
          {
            id: new Date().getTime(),
            title: newTaskTitle,
            done: false,
          },
        ]);
        tasksCounter.add(1); // Increment task count
      }
    } catch (error) {
      span.recordException(error); // Record any errors
    } finally {
     span.end(); // End the span
    }
  }

  function handleToggleTaskDone(id: number) {
    const span = tracer.startSpan('Toggle Task');
    try {
      const task = tasks.find((task) => task.id === id);
      if (task && !task.done) {
        tasksCompletedCounter.add(1); // Increment completed task count
      }
      const newTasks = tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            done: !task.done,
          };
        }
        return task;
      });
      setTasks(newTasks);
    } finally {
     span.end();
    }
  }

  function handleRemoveTask(id: number) {
   const span = tracer.startSpan('Remove Task');
    try {
      const newTasks = tasks.filter((task) => task.id !== id);
      setTasks(newTasks);
      tasksRemovedCounter.add(1); // Increment removed task count
    } finally {
     span.end();
    }
  }

  function handleUpdateTaskName(id: number, newTaskName: string) {
    const span = tracer.startSpan('Update Task Name', {
      attributes: {
        'component': 'task-manager',
        'operation.name': 'updateTaskName',
        'task.id': id,
      },
    });
  
    try {
      const taskExists = tasks.some((task) => task.id === id);
  
      if (!taskExists) {
        span.setStatus({ code: 2, message: 'Task not found' }); // Mark span as error
        console.error(`Task with ID ${id} not found.`);
        return;
      }
  
      const newTasks = tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            title: newTaskName,
          };
        }
        return task;
      });
  
      setTasks(newTasks);
  
      // Add attributes to the span for better trace visibility
      span.setAttribute('task.updatedName', newTaskName);
      span.addEvent('Task name updated successfully', {
        'task.id': id,
        'newTaskName': newTaskName,
      });
    } catch (error) {
      // Record any errors that occur
      span.recordException(error);
      span.setStatus({ code: 2, message: 'Error updating task name' }); // Mark span as error
      console.error('Error updating task name:', error);
    } finally {
      span.end(); // Ensure the span is ended
      console.log('Span for updating task name ended.');
    }
  }

  return (
    <View style={styles.container}>
      <Header tasksCounter={tasks.length} />

      <TodoInput addTask={handleAddTask} />

      <TasksList
        tasks={tasks}
        toggleTaskDone={handleToggleTaskDone}
        removeTask={handleRemoveTask}
        updateTaskName={handleUpdateTaskName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBEBEB",
  },
});
