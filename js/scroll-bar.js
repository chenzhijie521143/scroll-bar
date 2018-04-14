(function(win,doc,$){
	// 构造函数
	function CusScrollBar(options){
		this._init(options);
	}
	// 扩展原型对象
	$.extend(CusScrollBar.prototype,{
		// 初始化
		_init:function(options){
			var self=this;
			// 默认配置
			self.options={
				scrollDir      :"y",    // 滚动方向
				contSelector   :"",     // 滚动区域选择器
				barSelector    :"",     // 滚动条选择器
				sliderSelector :"",     // 滚动滑块选择器
				wheelStep      :10,     // 滚轮步长 ，默认为10 
				tabItemSelector:"",     // 标签类名
				tabActiveClass :"",     // 选中类名
				anchorSelector :"",     // 锚点选择器
				correctSelector:"",     // 校正元素
				articalSelector:"",     // 文章选择器
				isAnimate      :false,  // 是否开启动画 ，默认无动画
				speed          :800,    // 动画时长
			}
			$.extend(true,self.options,options || {});
			self._initDomEvent();
			return self;
		},
		// 初始化dom元素
		_initDomEvent:function(){
			var opts=this.options;
			// 滚动区域
			this.$cont=$(opts.contSelector);
			// 滚动条
			this.$slider=$(opts.sliderSelector);
			// 滑块
			this.$bar=opts.barSelector ? $(opts.barSelector) : self.$slider.parent();
			// 文档对象
		    this.$doc=$(doc);
		    // 标签项
		    this.$tabItem=$(opts.tabItemSelector);
		    // 锚点项
		    this.$anchor=$(opts.anchorSelector);
		    // 文章
		    this.$article=$(opts.articalSelector);
		    // 校正元素对象
		    this.$correct=$(opts.correctSelector);
		    // 启动函数
		    this._initSliderDragEvent()
		        ._bindContScroll()
		        ._bindMouseWheel()
		        ._initTabEvent()
		        .initArticleHeight();
		},
		// 初始化滑块拖动功能
		_initSliderDragEvent:function(self){
			var slider=this.$slider,
			    sliderEl=slider[0],
			    self=this;
			if(sliderEl){
				var doc=this.$doc,
				    dragStratPagePosition,
				    dragStartScrollPosition,
				    dragContBarRate;
				function mousemoveHandler (e){
					e.preventDefault;
					console.log("mousemove");
					if(dragStratPagePosition == null){
						return;
					}
					// 鼠标按下 到 移动到当前位置 之间的距离 
					var dis=e.pageY-dragStratPagePosition;
					self.scrollTo(dragStartScrollPosition + dis*dragContBarRate);
				}
				slider.on("mousedown",function(e){
					e.preventDefault();
					console.log("mousedown");
					dragStratPagePosition=e.pageY;
					dragStartScrollPosition=self.$cont[0].scrollTop;
					dragContBarRate=self.getMaxScrollPosition() / self.getMaxSliderPosition();+
					doc.on("mousemove.scroll",mousemoveHandler).on("mouseup.scroll",function(e){
						console.log("mouseup");
						doc.off(".scroll");
					});
				});
			}
			return self;
		},
		// 监听鼠标滚轮 同步内容滚动
		_bindMouseWheel:function(){
			var self=this;
			self.$cont.on("mousewheel DOMMouseScroll",function(e){
				console.log("mousewheel");
				e.preventDefault();
				var oEv=e.originalEvent,
				    wheelRange=oEv.wheelDelta ? -oEv.wheelDelta/120 : (oEv.deltail || 0)/3;
				self.scrollTo(self.$cont[0].scrollTop + wheelRange * self.options.wheelStep);
//				console.log(wheelRange); // 1 / -1
			});
			return self;
		},
		// 监听内容的滚动 ,同步滑块的位置
		_bindContScroll:function(){
			var self=this;
			self.$cont.on("scroll",function(){
				var sliderEl=self.$slider[0];
				if(sliderEl){
					sliderEl.style.top=self.getSliderPosition() + "px";
				}
			});
			return self;
		},
		// 标签切换 、定位
		_initTabEvent:function(){
			var self=this;
			self.$tabItem.on("click",function(e){
				e.preventDefault();
				var index=$(this).index();
				self.changeTabSelect(index);
				
				// 已经滚出可视区的高度 + 指定锚点与内容容器的距离
				self.scrollTo(self.$cont[0].scrollTop +self.getAnchorPosition(index),self.options.isAnimate);
			});
			return self;
		},
		// 初始化文档高度
		initArticleHeight:function(){
			var self=this,
			    lastArticle=self.$article.last();
			    
			    // 比较 最后一篇文章高度 和可视区高度
			var lastArticleHeight=lastArticle.height(),
			    contHeight=self.$cont.height();
			if(lastArticleHeight < contHeight){
				self.$correct[0].style.height=contHeight -
				lastArticleHeight-self.$anchor.outerHeight()+"px";
			}
		},
		// 获取锚点与父元素的距离
		getAnchorPosition:function(index){
			return this.$anchor.eq(index).position().top;
		},
		// 切换标签的选中
		changeTabSelect:function(index){
			var self=this,
			    active=self.options.tabActiveClass;
			return self.$tabItem.eq(index).addClass(active)
			       .siblings().removeClass(active);
		},
		// 计算滑块当前的位置
		getSliderPosition:function(){
			var self=this;
			var maxSliderPosition=self.getMaxSliderPosition();
			// 内容区域滚动的比例
			var disContRate=self.$cont[0].scrollTop/self.getMaxScrollPosition();
			
			return Math.min(maxSliderPosition,maxSliderPosition * disContRate);
		},
		// 内容可滚动的高度
		getMaxScrollPosition:function(){
			var self=this;
			return Math.max(self.$cont.height(),self.$cont[0].scrollHeight)-self.$cont.height();
		},
		// 滑块可移动的距离
		getMaxSliderPosition:function(){
			var self=this;
			return self.$bar.height() - self.$slider.height();
		},
		// 获取每个锚点位置信息的数组
		getAllAnchorPosition:function(){
			var self=this,
			    allPositionArr=[];
			for(var i=0;i<self.$anchor.length;i++){
				allPositionArr.push(self.$cont[0].scrollTop + self.getAnchorPosition(i));
			}
			return allPositionArr;
		},
		// 设置滚动位置
		scrollTo:function(positionVal,isAnimate){
			var self=this;
			var posArr=self.getAllAnchorPosition();
			function getIndex(positionVal){
				for(var i=posArr.length-1;i>=0;i--){
					if(positionVal>=posArr[i]){
						return i;
					}else{
						continue;
					}
				}
			}
			
			// 锚点数与标签数相同
			if(posArr.length == self.$tabItem.length){
				self.changeTabSelect(getIndex(positionVal));
			}
            if(isAnimate){
            	self.$cont.animate({scrollTop:positionVal+"px"},self.options.speed);
            	console.log("animate:"+self.options.speed);
            }else{
            	self.$cont.scrollTop(positionVal);
            	console.log("no animate");
            }
		}
		
	});
	win.CusScrollBar=CusScrollBar;
})(window,document,jQuery);










