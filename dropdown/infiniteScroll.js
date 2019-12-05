var $ = require('jquery');

function InfiniteScroll(decorated, options, dataAdapter) {
    this.lastParams = {};

    decorated.call(this, options, dataAdapter);

    this.$loadingMore = this.createLoadingMore();
    this.loading = false;
}

// append is the Results.append method to add data
InfiniteScroll.prototype.append = function(decorated, data) {
    this.$loadingMore.remove();
    this.loading = false;

    decorated.call(this, data);

    if (this.showLoadingMore(data)) {
        this.$results.append(this.$loadingMore);
        this.loadMoreIfNeeded();
    }
};

InfiniteScroll.prototype.bind = function(decorated, container) {
    var self = this;

    decorated.call(this, container);

    container.on('query', function(params) {
        self.lastParams = params;
        self.loading = true;
    });

    container.on('query:append', function(params) {
        self.lastParams = params;
        self.loading = true;
    });

    this.$results.on('scroll', this.loadMoreIfNeeded.bind(this));
};

InfiniteScroll.prototype.loadMoreIfNeeded = function () {
  var isLoadMoreVisible = $.contains(
    document.documentElement,
    this.$loadingMore[0]
  );

  if (this.loading || !isLoadMoreVisible) {
    return;
  }

  var currentOffset = this.$results.offset().top +
    this.$results.outerHeight(false);
  var loadingMoreOffset = this.$loadingMore.offset().top +
    this.$loadingMore.outerHeight(false);

  if (currentOffset + 50 >= loadingMoreOffset) {
    this.loadMore();
  }
};

InfiniteScroll.prototype.loadMore = function() {
    this.loading = true;

    var params = $.extend({}, {
        page: 1
    }, this.lastParams);

    params.page++;

    this.emit('query:append', params);
};

InfiniteScroll.prototype.showLoadingMore = function(_, data) {
    return data.pagination && data.pagination.more;
};

InfiniteScroll.prototype.createLoadingMore = function() {
    var $option = $(
        '<li ' +
        'class="select2-results__option select2-results__option--load-more"' +
        'role="option" aria-disabled="true"></li>'
    );

    var message = this.options.get('translations').get('loadingMore');

    $option.html(message(this.lastParams));

    return $option;
};

module.exports = InfiniteScroll;
