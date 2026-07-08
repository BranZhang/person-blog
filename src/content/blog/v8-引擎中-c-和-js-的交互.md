---
title: "V8 引擎中 C++ 和 JS 的交互"
description: "在 V8 引擎中，JavaScript 和 C++ 之间的交互涉及了 JavaScript 对象与 C++ 对象的映射，内存管理，以及函数调用的桥接等。本文主要参照 V8 的代码，&hellip;"
pubDate: "2024-06-08T07:34:00.000Z"
updatedDate: "2025-02-24T07:58:16.000Z"
published: true
tags: ["C++","JavaScript","V8"]
---
<p class="wp-block-paragraph">在 V8 引擎中，JavaScript 和 C++ 之间的交互涉及了 JavaScript 对象与 C++ 对象的映射，内存管理，以及函数调用的桥接等。本文主要参照 V8 的代码，来讲讲如何实现 JS 调用 C++。JS 调用 C++，分为 JS 调用 C++ 函数（全局），和调用 C++ 类。</p>

<!--more-->

<h2 class="wp-block-heading">数据及模板</h2>

<p class="wp-block-paragraph">由于 C++ 原生数据类型与 JavaScript 中数据类型有很大差异，因此 V8 提供了 Value 类，从 JavaScript 到 C++，从 C++ 到 JavaScrpt 都会用到这个类及其子类，比如：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Handle&lt;Value> Add(const Arguments&amp; args){
  int a = args[0]->Uint32Value(); 
  int b = args[1]->Uint32Value(); 

  return Integer::New(a+b); 
}</pre>

<p class="wp-block-paragraph">Integer 即为 Value 的一个子类。V8 中，有两个模板 (Template) 类 (并非 C++ 中的模板类)：</p>

<ul class="wp-block-list">
<li>对象模板 (ObjectTemplate)</li>

<li>函数模板 (FunctionTemplate) 这两个模板类用以定义 JavaScript 对象和 JavaScript 函数。我们在后续的小节部分将会接触到模板类的实例。通过使用 ObjectTemplate，可以将 C++ 中的对象暴露给脚本环境，类似的，FunctionTemplate 用以将 C++ 函数暴露给脚本环境，以供脚本使用。</li>
</ul>

<h2 class="wp-block-heading">JS 使用 C++ 变量</h2>

<p class="wp-block-paragraph">在 JavaScript 与 V8 间共享变量事实上是非常容易的，基本模板如下：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">static char sname[512] = {0}; 

static Handle&lt;Value> NameGetter(Local&lt;String> name, const AccessorInfo&amp; info) {
   return String::New((char*)&amp;sname,strlen((char*)&amp;sname)); 
} 

static void NameSetter(Local&lt;String> name, Local&lt;Value> value, const AccessorInfo&amp; info) {
  Local&lt;String> str = value->ToString(); 
  str->WriteAscii((char*)&amp;sname); 
}</pre>

<p class="wp-block-paragraph">定义了 NameGetter, NameSetter 之后，在 main 函数中，将其注册在 global 上：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">// Create a template for the global object. 
Handle&lt;ObjectTemplate> global = ObjectTemplate::New(); 
//public the name variable to script 
global->SetAccessor(String::New("name"), NameGetter, NameSetter);</pre>

<h2 class="wp-block-heading">JS 调用 C++ 函数</h2>

<p class="wp-block-paragraph">在 JavaScript 中调用 C++ 函数是脚本化最常见的方式，通过使用 C++ 函数，可以极大程度的增强 JavaScript 脚本的能力，如文件读写，网络 / 数据库访问，图形 / 图像处理等等，类似于 JAVA 的 jni 技术。</p>

<p class="wp-block-paragraph">在 C++ 代码中，定义以下原型的函数：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group=""> Handle&lt;Value> func(const Arguments&amp; args){//return something}</pre>

<p class="wp-block-paragraph">然后，再将其公开给脚本：&nbsp;<code>global-&gt;Set(String::New("func"),FunctionTemplate::New(func));</code></p>

<h2 class="wp-block-heading">JS 使用 C++ 类</h2>

<p class="wp-block-paragraph">如果从面向对象的视角来分析，最合理的方式是将 C++ 类公开给 JavaScript，这样可以将 JavaScript 内置的对象数量大大增加，从而尽可能少的使用宿主语言，而更大的利用动态语言的灵活性和扩展性。</p>

<p class="wp-block-paragraph">事实上，C++ 语言概念众多，内容繁复，学习曲线较 JavaScript 远为陡峭。最好的应用场景是：既有脚本语言的灵活性， 又有 C/C++ 等系统语言的效率。使用 V8 引擎，可以很方便的将 C++ 类” 包装” 成可供 JavaScript 使用的资源。</p>

<p class="wp-block-paragraph">我们这里举一个较为简单的例子，定义一个 Person 类，然后将这个类包装并暴露给 JavaScript 脚本，在脚本中新建 Person 类的对象，使用 Person 对象的方法。 首先，我们在 C++ 中定义好类 Person：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">class Person { 
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
};</pre>

<p class="wp-block-paragraph">Person 类的结构很简单，只包含两个字段 age 和 name，并定义了各自的 getter/setter. 然后我们来定义构造器的包装：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Handle&lt;Value> PersonConstructor(const Arguments&amp; args){
  Handle&lt;Object> object = args.This(); 
  HandleScope handle_scope; 
  int age = args[0]->Uint32Value(); 

  String::Utf8Value str(args[1]); 
  char* name = ToCString(str); 

  Person *person = new Person(age, name); 
  object->SetInternalField(0, External::New(person)); 
  return object; 
}</pre>

<p class="wp-block-paragraph">从函数原型上可以看出，构造器的包装与上一小节中，函数的包装是一致的，因为构造函数在 V8 看来，也是一个函数。需要注意的是， 从 args 中获取参数并转换为合适的类型之后，我们根据此参数来调用 Person 类实际的构造函数，并将其设置在 object 的内部字段中。紧接着，我们需要包装 Person 类的getter/setter：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Handle&lt;Value> PersonGetAge(const Arguments&amp; args){
  Local&lt;Object> self = args.Holder(); 
  Local&lt;External> wrap = Local&lt;External>::Cast(self->GetInternalField(0)); 

  void *ptr = wrap->Value(); 

  return Integer::New(static_cast&lt;Person*>(ptr)->getAge()); 
} 

Handle&lt;Value> PersonSetAge(const Arguments&amp; args) {
  Local&lt;Object> self = args.Holder(); 
  Local&lt;External> wrap = Local&lt;External>::Cast(self->GetInternalField(0)); 

  void* ptr = wrap->Value(); 

  static_cast&lt;Person*>(ptr)->setAge(args[0]->Uint32Value()); 
  return Undefined();
}</pre>

<p class="wp-block-paragraph">而 getName 和 setName 的与上例类似。在对函数包装完成之后，需要将 Person 类暴露给脚本环境： 首先，创建一个新的函数模板，将其与字符串”Person” 绑定，并放入 global：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Handle&lt;FunctionTemplate> person_template = FunctionTemplate::New(PersonConstructor); 
person_template->SetClassName(String::New("Person")); 
global->Set(String::New("Person"), person_template);</pre>

<p class="wp-block-paragraph">然后定义原型模板：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Handle&lt;ObjectTemplate> person_proto = person_template->PrototypeTemplate(); 

person_proto->Set("getAge", FunctionTemplate::New(PersonGetAge)); 
person_proto->Set("setAge", FunctionTemplate::New(PersonSetAge)); 

person_proto->Set("getName", FunctionTemplate::New(PersonGetName)); 
person_proto->Set("setName", FunctionTemplate::New(PersonSetName));</pre>

<p class="wp-block-paragraph">最后设置实例模板：</p>

<pre class="EnlighterJSRAW" data-enlighter-language="generic" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">Handle&lt;ObjectTemplate> person_inst = person_template->InstanceTemplate(); 
person_inst->SetInternalFieldCount(1);</pre>

<h2 class="wp-block-heading">C++ 调用 JS 函数</h2>

<p class="wp-block-paragraph">我们直接看下 src/timer_wrap.cc 的例子，V8 编译执行 timer.js, 构造了 Timer 对象。</p>

<pre class="EnlighterJSRAW" data-enlighter-language="cpp" data-enlighter-theme="" data-enlighter-highlight="" data-enlighter-linenumbers="" data-enlighter-lineoffset="" data-enlighter-title="" data-enlighter-group="">static void OnTimeout(uv_timer_t* handle) {
    TimerWrap* wrap = static_cast&lt;TimerWrap*>(handle->data);
    Environment* env = wrap->env();
    HandleScope handle_scope(env->isolate());
    Context::Scope context_scope(env->context());
    wrap->MakeCallback(kOnTimeout, 0, nullptr);
}

inline v8::Local&lt;v8::Value> AsyncWrap::MakeCallback(uint32_t index, int argc, v8::Local&lt;v8::Value>* argv) {
    v8::Local&lt;v8::Value> cb_v = object()->Get(index);
    CHECK(cb_v->IsFunction());
    return MakeCallback(cb_v.As&lt;v8::Function>(), argc, argv);
}</pre>

<p class="wp-block-paragraph"><code>TimerWrap</code> 对象通过数组的索引寻址，找到 Timer 对象索引 0 的对象，而对其赋值的是在 lib/timer.js 里面的 <code>list._timer[kOnTimeout] = listOnTimeout;</code> 。这边找到的对象是个 <code>Function</code>, 后面忽略 domains 异常处理等，就是简单的调用 Function 对象的 Call 方法, 并且传人上文提到的 Context 和参数。</p>

<p class="wp-block-paragraph"><code>Local&lt;Value&gt; ret = callback-&gt;Call(recv, argc, argv);</code></p>

<p class="wp-block-paragraph">这就实现了 C++ 对 JS 函数的调用。</p>

<h2 class="wp-block-heading">总结</h2>

<p class="wp-block-paragraph">语言之间的交互其实远不止上述罗列的这些，其他诸如内存管理，函数回调，错误处理和异常传递，线程和并发等等都是需要考虑的。</p>

<h2 class="wp-block-heading">参考资料</h2>

<ul class="wp-block-list">
<li><a href="https://yjhjstz.gitbooks.io/deep-into-node/content/chapter2/chapter2-1.html" target="_blank" rel="noopener">C++ 和 JS 交互</a></li>

<li><a href="https://v8.dev/" target="_blank" rel="noopener">What is V8?</a></li>
</ul>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>

<p class="wp-block-paragraph"></p>
