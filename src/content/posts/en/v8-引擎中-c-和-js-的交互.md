---
title: "Interoperability Between C++ and JavaScript in V8"
description: "How V8 maps values, exposes C++ variables, functions, and classes to JavaScript, and invokes JavaScript callbacks from C++."
pubDatetime: 2024-06-08T07:34:00.000Z
modDatetime: 2025-02-24T07:58:16.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["C++", "JavaScript", "V8"]
---

Interoperability between JavaScript and C++ in V8 involves mapping JavaScript objects to C++ objects, managing memory, and bridging function calls. Using V8 code as a reference, this article explains two forms of JavaScript-to-C++ calls: invoking global C++ functions and working with exposed C++ classes.

## Values and Templates

Because native C++ types differ substantially from JavaScript types, V8 provides the `Value` class and its subclasses for conversions in both directions. For example:

```cpp
Handle<Value> Add(const Arguments& args){
  int a = args[0]->Uint32Value();
  int b = args[1]->Uint32Value();

  return Integer::New(a+b);
}
```

`Integer` is a subclass of `Value`. V8 also provides two `Template` classes, which should not be confused with C++ class templates:

- `ObjectTemplate`
- `FunctionTemplate`

These classes define the shape and behavior of JavaScript objects and functions. `ObjectTemplate` exposes C++ objects to the scripting environment, while `FunctionTemplate` exposes C++ functions.

## Accessing C++ Variables from JavaScript

Sharing a variable between JavaScript and V8 is straightforward. A basic accessor pair looks like this:

```cpp
static char sname[512] = {0};

static Handle<Value> NameGetter(Local<String> name, const AccessorInfo& info) {
   return String::New((char*)&sname,strlen((char*)&sname));
}

static void NameSetter(Local<String> name, Local<Value> value, const AccessorInfo& info) {
  Local<String> str = value->ToString();
  str->WriteAscii((char*)&sname);
}
```

After defining `NameGetter` and `NameSetter`, register them on the global object in `main`:

```cpp
// Create a template for the global object.
Handle<ObjectTemplate> global = ObjectTemplate::New();
//public the name variable to script
global->SetAccessor(String::New("name"), NameGetter, NameSetter);
```

## Calling C++ Functions from JavaScript

Calling C++ functions is one of the most common ways to extend a scripting environment. Native functions can give JavaScript access to file I/O, networks, databases, graphics, and image processing, in a role similar to JNI in Java.

Define a C++ function with the following signature:

```text
 Handle<Value> func(const Arguments& args){//return something}
```

Then expose it to the script: `global->Set(String::New("func"), FunctionTemplate::New(func));`

## Using C++ Classes from JavaScript

From an object-oriented perspective, exposing an entire C++ class is often the most natural approach. It expands the objects available to JavaScript, minimizes the amount of host-language glue code, and preserves the flexibility of the dynamic language.

C++ has many concepts and a much steeper learning curve than JavaScript. A good embedding design combines the flexibility of a scripting language with the efficiency of a systems language. V8 makes it possible to wrap a C++ class as a resource that JavaScript can use.

As a simple example, define a `Person` class, wrap it, expose it to JavaScript, and then create and use `Person` instances from a script. The C++ class is:

```cpp
class Person {
private:
  unsigned int age;
  char name[512];

public:
  Person(unsigned int age, char *name) {
    this->age = age;
    strncpy(this->name, name, sizeof(this->name));
  }

  unsigned int getAge() {
    return this->age;
  }

  void setAge(unsigned int nage) {
    this->age = nage;
  }

  char *getName() {
    return this->name;
  }

  void setName(char *nname) {
    strncpy(this->name, nname, sizeof(this->name));
  }
};
```

The class contains two fields, `age` and `name`, with corresponding getters and setters. Next, wrap its constructor:

```cpp
Handle<Value> PersonConstructor(const Arguments& args){
  Handle<Object> object = args.This();
  HandleScope handle_scope;
  int age = args[0]->Uint32Value();

  String::Utf8Value str(args[1]);
  char* name = ToCString(str);

  Person *person = new Person(age, name);
  object->SetInternalField(0, External::New(person));
  return object;
}
```

The constructor wrapper has the same signature as the function wrapper in the previous section because V8 treats a constructor as a function. It extracts and converts values from `args`, invokes the real `Person` constructor, and stores the resulting pointer in an internal field of the JavaScript object. The `Person` accessors are then wrapped as follows:

```cpp
Handle<Value> PersonGetAge(const Arguments& args){
  Local<Object> self = args.Holder();
  Local<External> wrap = Local<External>::Cast(self->GetInternalField(0));

  void *ptr = wrap->Value();

  return Integer::New(static_cast<Person*>(ptr)->getAge());
}

Handle<Value> PersonSetAge(const Arguments& args) {
  Local<Object> self = args.Holder();
  Local<External> wrap = Local<External>::Cast(self->GetInternalField(0));

  void* ptr = wrap->Value();

  static_cast<Person*>(ptr)->setAge(args[0]->Uint32Value());
  return Undefined();
}
```

The `getName` and `setName` wrappers follow the same pattern. After wrapping the methods, expose the `Person` class to the scripting environment. First create a function template, assign it the class name `Person`, and add it to the global object:

```cpp
Handle<FunctionTemplate> person_template = FunctionTemplate::New(PersonConstructor);
person_template->SetClassName(String::New("Person"));
global->Set(String::New("Person"), person_template);
```

Next, configure the prototype template:

```cpp
Handle<ObjectTemplate> person_proto = person_template->PrototypeTemplate();

person_proto->Set("getAge", FunctionTemplate::New(PersonGetAge));
person_proto->Set("setAge", FunctionTemplate::New(PersonSetAge));

person_proto->Set("getName", FunctionTemplate::New(PersonGetName));
person_proto->Set("setName", FunctionTemplate::New(PersonSetName));
```

Finally, configure the instance template:

```text
Handle<ObjectTemplate> person_inst = person_template->InstanceTemplate();
person_inst->SetInternalFieldCount(1);
```

## Calling JavaScript Functions from C++

Consider the example in `src/timer_wrap.cc`, where V8 compiles and executes `timer.js` and constructs a `Timer` object.

```cpp
static void OnTimeout(uv_timer_t* handle) {
    TimerWrap* wrap = static_cast<TimerWrap*>(handle->data);
    Environment* env = wrap->env();
    HandleScope handle_scope(env->isolate());
    Context::Scope context_scope(env->context());
    wrap->MakeCallback(kOnTimeout, 0, nullptr);
}

inline v8::Local<v8::Value> AsyncWrap::MakeCallback(uint32_t index, int argc, v8::Local<v8::Value>* argv) {
    v8::Local<v8::Value> cb_v = object()->Get(index);
    CHECK(cb_v->IsFunction());
    return MakeCallback(cb_v.As<v8::Function>(), argc, argv);
}
```

`TimerWrap` performs an indexed lookup to retrieve the value at index 0 of the `Timer` object. That value was assigned in `lib/timer.js` by `list._timer[kOnTimeout] = listOnTimeout;`. The retrieved value is a `Function`. Ignoring domain-related exception handling, V8 invokes its `Call` method with the previously described context and arguments.

`Local<Value> ret = callback->Call(recv, argc, argv);`

This completes the call from C++ into a JavaScript function.

## Summary

Language interoperability involves much more than the examples above. A production embedding must also address memory management, callbacks, error handling and exception propagation, threading, and concurrency.

## References

- [C++ and JavaScript Interoperability (Chinese)](https://yjhjstz.gitbooks.io/deep-into-node/content/chapter2/chapter2-1.html)
- [What is V8?](https://v8.dev/)
